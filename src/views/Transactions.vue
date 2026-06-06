<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h4 class="mb-0">Giao Dịch</h4>
      <DateRange
        default-value="thisMonth"
        @range-selected="handleDateRangeChange"
      />
    </div>

    <!-- Filter Controls -->
    <div class="mb-4 d-flex justify-content-end">
      <div class="d-flex flex-wrap gap-2">
        <CDropdown>
          <CDropdownToggle color="light">
            {{ selectedCategoryLabel }}
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem @click="selectCategory(null)">
              Tất cả danh mục
            </CDropdownItem>
            <CDropdownItem
              v-for="category in store.categories"
              :key="category.id"
              @click="selectCategory(category.id)"
            >
              {{ category.name }}
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
        <CDropdown>
          <CDropdownToggle color="light">
            {{ selectedAccountLabel }}
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem @click="selectAccount(null)">
              Tất cả tài khoản
            </CDropdownItem>
            <CDropdownItem
              v-for="account in store.accounts"
              :key="account.id"
              @click="selectAccount(account.id)"
            >
              {{ account.name }}
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </div>
    </div>

    <!-- Group transactions by date -->
    <template v-for="(transactions, date) in groupedTransactions" :key="date">
      <div class="fw-bold fs-6 text-primary">
        {{ formatDateHeader(date) }}
      </div>
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="swipe-row my-3"
      >
        <div
          class="swipe-actions"
          :class="{ 'is-visible': activeSwipeTransactionId === transaction.id }"
        >
          <CButton
            color="primary"
            class="swipe-action"
            @click.stop="editTransaction(transaction)"
          >
            Sửa
          </CButton>
          <CButton
            color="danger"
            class="swipe-action"
            @click.stop="deleteTransaction(transaction.id)"
          >
            Xóa
          </CButton>
        </div>
        <CCard
          class="transaction-item"
          :class="{ 'is-swiped': activeSwipeTransactionId === transaction.id }"
          @click="handleTransactionClick(transaction.id)"
          @touchstart.passive="handleTouchStart($event, transaction.id)"
          @touchmove.passive="handleTouchMove($event)"
          @touchend="handleTouchEnd(transaction.id)"
        >
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-1">
                  {{
                    transaction.type === "transfer"
                      ? `${getAccountName(
                          transaction.fromAccount,
                        )} → ${getAccountName(transaction.toAccount)}`
                      : transaction.description
                  }}
                </h5>
                <div class="text-muted">
                  {{ formatDateTime(transaction.date) }}<br />
                  {{ getTransactionDateTime(transaction) }}
                </div>
              </div>
              <div class="d-flex align-items-center">
                <h5
                  class="mb-0 me-3"
                  :class="{
                    'text-success':
                      transaction.type === 'income' ||
                      transaction.type === 'credit_payment',
                    'text-danger': transaction.type === 'expense',
                  }"
                >
                  {{
                    transaction.type === "income" ||
                    transaction.type === "credit_payment"
                      ? "+"
                      : transaction.type === "expense"
                        ? "-"
                        : ""
                  }}{{ transaction.amount.toLocaleString() }}đ
                </h5>
                <div class="desktop-actions">
                  <CButton
                    color="primary"
                    variant="ghost"
                    size="sm"
                    class="me-2"
                    @click="handleEdit(transaction)"
                  >
                    Sửa
                  </CButton>
                  <CButton
                    color="danger"
                    variant="ghost"
                    size="sm"
                    @click="handleDelete(transaction.id)"
                  >
                    Xóa
                  </CButton>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </template>

    <!-- Replace Add Transaction Modal with component -->
    <CreateTransaction v-model="showTransactionModal" />

    <Transfer
      :visible="showTransferModal"
      @close="showTransferModal = false"
      @submit="showTransferModal = false"
    />

    <EditTransaction
      :visible="showEditModal"
      :transaction="selectedTransaction"
      @close="showEditModal = false"
      @submit="showEditModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "@/stores";
import { useRoute } from "vue-router";
import DateRange from "@/components/DateRange.vue";
import CreateTransaction from "@/components/Transactions/Create.vue";
import EditTransaction from "@/components/Transactions/Edit.vue";
import Transfer from "@/components/Transactions/Transfer.vue";
import moment from "moment";

const store = useStore();
const route = useRoute();
const showTransactionModal = ref(false);
const showTransferModal = ref(false);
const showEditModal = ref(false);
const selectedTransaction = ref(null);
const selectedCategoryId = ref(null);
const selectedAccountId = ref(null);
const activeSwipeTransactionId = ref(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDeltaX = ref(0);
const suppressClick = ref(false);
const dateRange = ref({
  start: null,
  end: null,
});

const sortedTransactions = computed(() => {
  let filtered = [...store.transactions];

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate >= dateRange.value.start &&
        transactionDate <= dateRange.value.end
      );
    });
  }

  // Apply category filter
  if (selectedCategoryId.value !== null) {
    filtered = filtered.filter((transaction) => {
      // Exclude transfer transactions when filtering by category
      return (
        transaction.type !== "transfer" &&
        transaction.type !== "credit_payment" &&
        transaction.categoryId === selectedCategoryId.value
      );
    });
  }

  // Apply account filter
  if (selectedAccountId.value !== null) {
    filtered = filtered.filter((transaction) => {
      // Include transfer transactions that involve the selected account
      if (transaction.type === "transfer") {
        return (
          transaction.fromAccount === selectedAccountId.value ||
          transaction.toAccount === selectedAccountId.value
        );
      }
      // Include regular transactions from the selected account
      return transaction.accountId === selectedAccountId.value;
    });
  }

  return filtered.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return Number(b.id) - Number(a.id);
  });
});

// Group transactions by date (YYYY-MM-DD)
const groupedTransactions = computed(() => {
  const groups = {};
  sortedTransactions.value.forEach((transaction) => {
    const dateKey = moment(transaction.date).format("YYYY-MM-DD");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
  });
  return groups;
});

const handleDateRangeChange = (range) => {
  dateRange.value = {
    start: range.start,
    end: range.end,
  };
};

const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId;
};

const selectAccount = (accountId) => {
  selectedAccountId.value = accountId;
};

// Initialize category and account from query parameters
onMounted(() => {
  const categoryIdFromQuery = route.query.category;
  if (categoryIdFromQuery) {
    // Keep as string since store.categories IDs are strings
    const categoryId = categoryIdFromQuery.toString();
    // Verify the category exists in the store
    const categoryExists = store.categories.find(
      (cat) => cat.id === categoryId,
    );
    if (categoryExists) {
      selectedCategoryId.value = categoryId;
    }
  }

  const accountIdFromQuery = route.query.account;
  if (accountIdFromQuery) {
    // Keep as string since store.accounts IDs are strings
    const accountId = accountIdFromQuery.toString();
    // Verify the account exists in the store
    const accountExists = store.accounts.find((acc) => acc.id === accountId);
    if (accountExists) {
      selectedAccountId.value = accountId;
    }
  }
});

// Watch for route query changes (when navigating from Overview)
watch(
  () => route.query.category,
  (newCategoryId) => {
    if (newCategoryId) {
      // Keep as string since store.categories IDs are strings
      const categoryId = newCategoryId.toString();
      const categoryExists = store.categories.find(
        (cat) => cat.id === categoryId,
      );
      if (categoryExists) {
        selectedCategoryId.value = categoryId;
      }
    } else {
      selectedCategoryId.value = null;
    }
  },
  { immediate: true },
);

// Watch for account query changes
watch(
  () => route.query.account,
  (newAccountId) => {
    if (newAccountId) {
      // Keep as string since store.accounts IDs are strings
      const accountId = newAccountId.toString();
      const accountExists = store.accounts.find((acc) => acc.id === accountId);
      if (accountExists) {
        selectedAccountId.value = accountId;
      }
    } else {
      selectedAccountId.value = null;
    }
  },
  { immediate: true },
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === null) {
    return "Tất cả d.mục";
  }
  const category = store.categories.find(
    (cat) => cat.id === selectedCategoryId.value,
  );
  return category ? category.name : "Tất cả d.mục";
});

const selectedAccountLabel = computed(() => {
  if (selectedAccountId.value === null) {
    return "Tất cả t.khoản ";
  }
  const account = store.accounts.find(
    (acc) => acc.id === selectedAccountId.value,
  );
  return account ? account.name : "Tất cả t.khoản";
});

const getAccountName = (id) => {
  return store.accounts.find((acc) => acc.id === id)?.name || "";
};

const getCategoryName = (id) => {
  return store.categories.find((cat) => cat.id === id)?.name || "";
};

const formatDateTime = (dateString) => {
  return moment(dateString).format("HH:mm");
};

const getTransactionDateTime = (transaction) => {
  if (transaction.type === "transfer") {
    return "";
  }

  if (transaction.type === "credit_payment") {
    return getAccountName(transaction.accountId);
  }

  return `${getAccountName(transaction.accountId)} - ${getCategoryName(
    transaction.categoryId,
  )}`;
};

const formatDateHeader = (dateString) => {
  // Hiển thị "Hôm nay", "Hôm qua" hoặc ngày định dạng DD/MM/YYYY
  const today = moment().format("YYYY-MM-DD");
  const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
  if (dateString === today) return "Hôm nay";
  if (dateString === yesterday) return "Hôm qua";
  return moment(dateString).format("DD/MM/YYYY");
};

const handleEdit = (transaction) => {
  selectedTransaction.value = transaction;
  showEditModal.value = true;
};

const editTransaction = (transaction) => {
  activeSwipeTransactionId.value = null;
  handleEdit(transaction);
};

const deleteTransaction = (id) => {
  activeSwipeTransactionId.value = null;
  handleDelete(id);
};

const handleDelete = async (id) => {
  try {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      return;
    }

    await store.deleteTransaction(id);
  } catch (error) {
    console.error("Error in handleDelete:", error);
    alert(error.message || "Có lỗi xảy ra khi xóa giao dịch");
  }
};
const handleTransactionClick = (id) => {
  if (suppressClick.value) {
    return;
  }

  if (activeSwipeTransactionId.value === id) {
    activeSwipeTransactionId.value = null;
  }
};

const handleTouchStart = (event, id) => {
  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  touchDeltaX.value = 0;

  if (activeSwipeTransactionId.value && activeSwipeTransactionId.value !== id) {
    activeSwipeTransactionId.value = null;
  }
};

const handleTouchMove = (event) => {
  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    touchDeltaX.value = deltaX;
  }
};

const handleTouchEnd = (id) => {
  if (touchDeltaX.value < -40) {
    activeSwipeTransactionId.value = id;
    suppressNextClick();
    return;
  }

  if (touchDeltaX.value > 40 && activeSwipeTransactionId.value === id) {
    activeSwipeTransactionId.value = null;
    suppressNextClick();
  }
};

const suppressNextClick = () => {
  suppressClick.value = true;
  setTimeout(() => {
    suppressClick.value = false;
  }, 250);
};
</script>

<style scoped>
.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.transaction-item {
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease;
  will-change: transform;
}

.swipe-actions {
  display: none;
}

.desktop-actions {
  display: flex;
  align-items: center;
}

@media (max-width: 767.98px) {
  .swipe-row {
    touch-action: pan-y;
  }

  .swipe-actions {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    display: flex;
    width: 112px;
    overflow: hidden;
    border-radius: 0;
    transform: translateX(112px);
    transition: transform 0.2s ease;
  }

  .swipe-actions.is-visible {
    transform: translateX(0);
  }

  .swipe-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 100%;
    border-radius: 0;
  }

  .desktop-actions {
    display: none;
  }

  .transaction-item.is-swiped {
    transform: translateX(-112px);
  }
}
</style>
