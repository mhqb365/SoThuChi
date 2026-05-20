<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Tổng Quan</h4>

      <router-link class="btn btn-outline-primary d-md-none" to="/backup">
        Sao Lưu
      </router-link>

      <DateRange
        default-value="thisMonth"
        @range-selected="handleDateRangeChange"
      />
    </div>

    <!-- Tổng quan số liệu -->
    <CRow class="my-3">
      <CCol sm="6" lg="4">
        <CCard class="mb-3">
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-medium-emphasis">Tổng Thu Nhập</div>
                <h4 class="text-success mb-0">
                  +{{ totalIncome.toLocaleString() }}đ
                </h4>
              </div>
              <div class="text-success">
                <TrendingUp :size="28" />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm="6" lg="4">
        <CCard class="mb-3">
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-medium-emphasis">Tổng Chi Tiêu</div>
                <h4 class="text-danger mb-0">
                  -{{ totalExpense.toLocaleString() }}đ
                </h4>
              </div>
              <div class="text-danger">
                <TrendingDown :size="28" />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm="6" lg="4">
        <CCard class="mb-3">
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-medium-emphasis">Số Giao Dịch</div>
                <h4 class="mb-0">{{ filteredTransactions.length }}</h4>
              </div>
              <div class="text-info">
                <List :size="28" />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- Danh mục Chi Tiêu -->
    <CCard class="my-3">
      <CCardHeader>
        <h5 class="mb-0">Chi Tiêu</h5>
      </CCardHeader>
      <CCardBody>
        <template v-if="expenseCategoryStats.length > 0">
          <div
            v-for="category in expenseCategoryStats"
            :key="category.id"
            class="d-flex justify-content-between align-items-center mb-3 cursor-pointer category-item"
            @click="navigateToTransactionsByCategory(category.id)"
          >
            <div class="flex-grow-1">
              <div
                class="d-flex justify-content-between align-items-center mb-1"
              >
                <span class="fw-medium">{{ category.name }}</span>
                <span class="text-danger fw-bold">
                  {{ category.amount.toLocaleString() }}đ
                </span>
              </div>
              <CProgress
                :value="category.percentage"
                color="danger"
                variant="striped"
                class="mb-1"
                style="height: 8px"
              />
              <div class="d-flex justify-content-between">
                <small class="text-medium-emphasis">
                  {{ category.count }} giao dịch
                </small>
                <small class="text-medium-emphasis">
                  {{ category.percentage.toFixed(1) }}%
                </small>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center text-medium-emphasis py-3">
          Không có dữ liệu
        </div>
      </CCardBody>
    </CCard>

    <!-- Danh mục Thu Nhập -->
    <CCard class="my-3">
      <CCardHeader>
        <h5 class="mb-0">Thu Nhập</h5>
      </CCardHeader>
      <CCardBody>
        <template v-if="incomeCategoryStats.length > 0">
          <div
            v-for="category in incomeCategoryStats"
            :key="category.id"
            class="d-flex justify-content-between align-items-center mb-3 cursor-pointer category-item"
            @click="navigateToTransactionsByCategory(category.id)"
          >
            <div class="flex-grow-1">
              <div
                class="d-flex justify-content-between align-items-center mb-1"
              >
                <span class="fw-medium">{{ category.name }}</span>
                <span class="text-success fw-bold">
                  {{ category.amount.toLocaleString() }}đ
                </span>
              </div>
              <CProgress
                :value="category.percentage"
                color="success"
                variant="striped"
                class="mb-1"
                style="height: 8px"
              />
              <div class="d-flex justify-content-between">
                <small class="text-medium-emphasis">
                  {{ category.count }} giao dịch
                </small>
                <small class="text-medium-emphasis">
                  {{ category.percentage.toFixed(1) }}%
                </small>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center text-medium-emphasis py-3">
          Không có dữ liệu
        </div>
      </CCardBody>
    </CCard>

    <!-- Giao dịch gần đây -->
    <CCard class="my-3">
      <CCardHeader>
        <h5 class="mb-0">Gần Đây</h5>
      </CCardHeader>
      <CCardBody>
        <template v-if="recentTransactions.length > 0">
          <div
            v-for="transaction in recentTransactions"
            :key="transaction.id"
            class="d-flex justify-content-between align-items-center py-2 border-bottom"
          >
            <div>
              <div class="fw-medium">{{ transaction.description }}</div>
              <small class="text-medium-emphasis">
                {{ getCategoryName(transaction.categoryId) }} •
                {{ getAccountName(transaction.accountId) }} •
                {{ formatDateTime(transaction.date) }}
              </small>
            </div>
            <div
              class="fw-bold"
              :class="{
                'text-success': transaction.type === 'income',
                'text-danger': transaction.type === 'expense',
              }"
            >
              {{ transaction.type === "income" ? "+" : "-"
              }}{{ transaction.amount.toLocaleString() }}đ
            </div>
          </div>
        </template>
        <div v-else class="text-center text-medium-emphasis py-3">
          Không có dữ liệu
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "@/stores";
import { useRouter } from "vue-router";
import DateRange from "@/components/DateRange.vue";
import moment from "moment";
import { TrendingUp, TrendingDown, List } from "@lucide/vue";

const store = useStore();
const router = useRouter();
const dateRange = ref({
  start: null,
  end: null,
});

// Xử lý thay đổi khoảng thời gian
const handleDateRangeChange = (range) => {
  dateRange.value = {
    start: range.start,
    end: range.end,
  };
};

// Lọc giao dịch theo khoảng thời gian
const filteredTransactions = computed(() => {
  let filtered = [...store.transactions];

  // Lọc theo khoảng thời gian
  if (dateRange.value.start && dateRange.value.end) {
    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate >= dateRange.value.start &&
        transactionDate <= dateRange.value.end
      );
    });
  }

  // Loại bỏ giao dịch chuyển khoản
  return filtered.filter((t) => t.type !== "transfer");
});

// Tính tổng thu nhập
const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
});

// Tính tổng chi tiêu
const totalExpense = computed(() => {
  return filteredTransactions.value
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
});

// Tính số dư ròng
const netBalance = computed(() => {
  return totalIncome.value - totalExpense.value;
});

// Thống kê danh mục chi tiêu
const expenseCategoryStats = computed(() => {
  const expenseTransactions = filteredTransactions.value.filter(
    (t) => t.type === "expense",
  );
  const categoryMap = {};

  // Nhóm theo danh mục
  expenseTransactions.forEach((transaction) => {
    const categoryId = transaction.categoryId;
    if (!categoryMap[categoryId]) {
      const category = store.categories.find((c) => c.id === categoryId);
      categoryMap[categoryId] = {
        id: categoryId,
        name: category?.name || "Không xác định",
        amount: 0,
        count: 0,
      };
    }
    categoryMap[categoryId].amount += transaction.amount;
    categoryMap[categoryId].count++;
  });

  // Chuyển thành array và tính phần trăm
  const result = Object.values(categoryMap).map((category) => ({
    ...category,
    percentage:
      totalExpense.value > 0 ? (category.amount / totalExpense.value) * 100 : 0,
  }));

  // Sắp xếp theo số tiền giảm dần
  return result.sort((a, b) => b.amount - a.amount);
});

// Thống kê danh mục thu nhập
const incomeCategoryStats = computed(() => {
  const incomeTransactions = filteredTransactions.value.filter(
    (t) => t.type === "income",
  );
  const categoryMap = {};

  // Nhóm theo danh mục
  incomeTransactions.forEach((transaction) => {
    const categoryId = transaction.categoryId;
    if (!categoryMap[categoryId]) {
      const category = store.categories.find((c) => c.id === categoryId);
      categoryMap[categoryId] = {
        id: categoryId,
        name: category?.name || "Không xác định",
        amount: 0,
        count: 0,
      };
    }
    categoryMap[categoryId].amount += transaction.amount;
    categoryMap[categoryId].count++;
  });

  // Chuyển thành array và tính phần trăm
  const result = Object.values(categoryMap).map((category) => ({
    ...category,
    percentage:
      totalIncome.value > 0 ? (category.amount / totalIncome.value) * 100 : 0,
  }));

  // Sắp xếp theo số tiền giảm dần
  return result.sort((a, b) => b.amount - a.amount);
});

// Giao dịch gần đây (5 giao dịch mới nhất)
const recentTransactions = computed(() => {
  return [...filteredTransactions.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
});

// Hàm tiện ích
const getCategoryName = (id) => {
  return (
    store.categories.find((cat) => cat.id === id)?.name || "Không xác định"
  );
};

const getAccountName = (id) => {
  return store.accounts.find((acc) => acc.id === id)?.name || "Không xác định";
};

const formatDateTime = (dateString) => {
  return moment(dateString).format("DD/MM/YYYY HH:mm");
};

// Navigate to transactions with category filter
const navigateToTransactionsByCategory = (categoryId) => {
  router.push({
    path: "/transactions",
    query: { category: categoryId },
  });
};
</script>

<style scoped>
.border-bottom:last-child {
  border-bottom: none !important;
}

.category-item {
  transition: background-color 0.2s ease;
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
}

.category-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
