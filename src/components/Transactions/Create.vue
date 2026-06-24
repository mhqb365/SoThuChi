<template>
  <CModal
    backdrop="static"
    :visible="modelValue"
    @close="$emit('update:modelValue', false)"
  >
    <CModalHeader>
      <CModalTitle>Thêm Giao Dịch</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <!-- Tab Navigation -->
      <CNav variant="tabs" class="mb-3">
        <CNavItem>
          <CNavLink
            :active="activeTab === 0"
            role="button"
            @click="activeTab = 0"
          >
            Giao Dịch
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            :active="activeTab === 1"
            role="button"
            @click="activeTab = 1"
          >
            Chuyển Khoản
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            :active="activeTab === 2"
            role="button"
            @click="activeTab = 2"
          >
            Thanh toán thẻ
          </CNavLink>
        </CNavItem>
      </CNav>

      <!-- Tab Content -->
      <div>
        <!-- Transaction Tab -->
        <div v-show="activeTab === 0">
          <CForm @submit.prevent="handleTransactionSubmit">
            <CRow class="mb-2">
              <CCol>
                <CFormSelect
                  v-model="transactionForm.type"
                  label="Loại"
                  :options="[
                    { label: 'Thu Nhập', value: 'income' },
                    { label: 'Chi Tiêu', value: 'expense' },
                  ]"
                  required
                  @change="handleTypeChange"
                />
              </CCol>
              <CCol>
                <CFormSelect
                  v-model="transactionForm.accountId"
                  label="Tài Khoản"
                  :options="[
                    { label: 'Chọn tài khoản', value: '' },
                    ...store.accounts.map((acc) => ({
                      label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                      value: acc.id,
                    })),
                  ]"
                  required
                />
              </CCol>
            </CRow>

            <CRow class="mb-3">
              <CCol>
                <CFormSelect
                  v-model="transactionForm.categoryId"
                  label="Danh Mục"
                  :options="[
                    { label: 'Chọn danh mục', value: '' },
                    ...filteredCategories.map((cat) => ({
                      label: cat.name,
                      value: cat.id.toString(),
                    })),
                  ]"
                  required
                />
              </CCol>
              <CCol>
                <div class="amount-field clearable-field">
                  <CFormInput
                    v-model.number="transactionForm.amount"
                    label="Số Tiền"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                  <button
                    v-if="hasInputValue(transactionForm.amount)"
                    class="clear-input-button"
                    type="button"
                    aria-label="Xóa số tiền"
                    @click="transactionForm.amount = ''"
                  >
                    <X :size="16" aria-hidden="true" />
                  </button>
                  <small
                    v-if="transactionAmountPreview"
                    class="amount-preview"
                  >
                    {{ transactionAmountPreview }}
                  </small>
                </div>
              </CCol>
            </CRow>

            <div class="clearable-field mb-3">
              <CFormInput
                v-model="transactionForm.description"
                label="Mô Tả"
                required
              />
              <button
                v-if="hasInputValue(transactionForm.description)"
                class="clear-input-button"
                type="button"
                aria-label="Xóa mô tả"
                @click="transactionForm.description = ''"
              >
                <X :size="16" aria-hidden="true" />
              </button>
            </div>

            <div class="d-flex">
              <CFormInput
                v-model="transactionForm.dateInput"
                type="date"
                required
                class="me-2"
              />
              <CFormInput
                v-model="transactionForm.timeInput"
                type="time"
                required
              />
            </div>
          </CForm>
        </div>

        <!-- Transfer Tab -->
        <div v-show="activeTab === 1">
          <CForm @submit.prevent="handleTransferSubmit">
            <CFormSelect
              v-model="transferForm.fromAccount"
              class="mb-3"
              label="Từ Tài Khoản"
              :options="[
                { label: 'Chọn tài khoản', value: '' },
                ...store.accounts.map((acc) => ({
                  label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                  value: acc.id,
                })),
              ]"
              required
            />
            <CFormSelect
              v-model="transferForm.toAccount"
              class="mb-3"
              label="Đến Tài Khoản"
              :options="[
                { label: 'Chọn tài khoản', value: '' },
                ...store.accounts.map((acc) => ({
                  label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                  value: acc.id,
                })),
              ]"
              required
            />
            <div class="amount-field clearable-field mb-3">
              <CFormInput
                v-model.number="transferForm.amount"
                label="Số Tiền"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                required
              />
              <button
                v-if="hasInputValue(transferForm.amount)"
                class="clear-input-button"
                type="button"
                aria-label="Xóa số tiền"
                @click="transferForm.amount = ''"
              >
                <X :size="16" aria-hidden="true" />
              </button>
              <small v-if="transferAmountPreview" class="amount-preview">
                {{ transferAmountPreview }}
              </small>
            </div>
            <div class="mb-3 d-flex">
              <CFormInput
                v-model="transferForm.dateInput"
                type="date"
                required
                class="me-2"
              />
              <CFormInput
                v-model="transferForm.timeInput"
                type="time"
                required
              />
            </div>
          </CForm>
        </div>
        <div v-show="activeTab === 2">
          <CForm @submit.prevent="handleCreditPaymentSubmit">
            <CFormSelect
              v-model="creditPaymentForm.accountId"
              class="mb-3"
              label="Thẻ tín dụng"
              :options="[
                { label: 'Chọn thẻ tín dụng', value: '' },
                ...creditAccounts.map((acc) => ({
                  label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                  value: acc.id,
                })),
              ]"
              required
            />
            <div class="amount-field clearable-field mb-3">
              <CFormInput
                v-model.number="creditPaymentForm.amount"
                label="Số Tiền Thanh Toán"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                required
              />
              <button
                v-if="hasInputValue(creditPaymentForm.amount)"
                class="clear-input-button"
                type="button"
                aria-label="Xóa số tiền"
                @click="creditPaymentForm.amount = ''"
              >
                <X :size="16" aria-hidden="true" />
              </button>
              <small
                v-if="creditPaymentAmountPreview"
                class="amount-preview"
              >
                {{ creditPaymentAmountPreview }}
              </small>
            </div>
            <div class="mb-3 d-flex">
              <CFormInput
                v-model="creditPaymentForm.dateInput"
                type="date"
                required
                class="me-2"
              />
              <CFormInput
                v-model="creditPaymentForm.timeInput"
                type="time"
                required
              />
            </div>
          </CForm>
        </div>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" @click="$emit('update:modelValue', false)">
        Đóng
      </CButton>
      <CButton color="primary" @click="handleSubmit">
        {{ submitLabel }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { X } from "@lucide/vue";
import { useStore } from "@/stores";
import moment from "moment";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue"]);
const store = useStore();

const activeTab = ref(0);

const getCurrentDateTime = () => {
  const now = moment();
  return {
    dateInput: now.format("YYYY-MM-DD"),
    timeInput: now.format("HH:mm"),
  };
};

const getDefaultCategoryId = (type) => {
  const defaultCategory = store.categories.find((cat) => cat.type === type);
  return defaultCategory?.id?.toString() || "";
};

const getDefaultAccountId = () => {
  // If there's a default account set in the store, use it
  if (
    store.defaultAccountId &&
    store.accounts.find(
      (acc) => acc.id.toString() === store.defaultAccountId.toString(),
    )
  ) {
    return store.defaultAccountId.toString();
  }
  // Otherwise fallback to the first account
  return store.accounts[0]?.id?.toString() || "";
};

const transactionForm = ref({
  type: "expense",
  accountId: getDefaultAccountId(),
  categoryId: getDefaultCategoryId("expense"),
  amount: "",
  description: "",
  ...getCurrentDateTime(),
});

const transferForm = ref({
  fromAccount: "",
  toAccount: "",
  amount: "",
  ...getCurrentDateTime(),
});

const creditPaymentForm = ref({
  accountId: "",
  amount: "",
  ...getCurrentDateTime(),
});

const creditAccounts = computed(() =>
  store.accounts.filter((account) => store.isCreditAccount(account)),
);

const submitLabel = computed(() => {
  if (activeTab.value === 0) return "Thêm";
  if (activeTab.value === 1) return "Chuyển";
  return "Thanh toán";
});

const normalizeAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  return numericAmount < 1000 ? numericAmount * 1000 : numericAmount;
};

const getAmountPreview = (amount) => {
  const numericAmount = Number(amount);
  const normalizedAmount = normalizeAmount(amount);

  if (!normalizedAmount || normalizedAmount === numericAmount) {
    return "";
  }

  return `${normalizedAmount.toLocaleString("vi-VN")} đ`;
};

const hasInputValue = (value) => {
  return value !== "" && value !== null && value !== undefined;
};

const transactionAmountPreview = computed(() =>
  getAmountPreview(transactionForm.value.amount),
);
const transferAmountPreview = computed(() =>
  getAmountPreview(transferForm.value.amount),
);
const creditPaymentAmountPreview = computed(() =>
  getAmountPreview(creditPaymentForm.value.amount),
);

const filteredCategories = computed(() => {
  return store.categories
    .filter((cat) => cat.type === transactionForm.value.type)
    .sort((a, b) => a.name.localeCompare(b.name));
});

watch(
  filteredCategories,
  (filtered) => {
    if (
      filtered.length > 0 &&
      !filtered.find((cat) => cat.id === transactionForm.value.categoryId)
    ) {
      transactionForm.value.categoryId = filtered[0].id.toString();
    }
  },
  { immediate: true },
);

const handleTypeChange = () => {
  transactionForm.value.categoryId = getDefaultCategoryId(
    transactionForm.value.type,
  );
};

// We can simplify the watch functionality to only save when explicitly changed by user
// This avoids potential issues with the initial setup
const userChangedAccount = ref(false);

watch(
  () => transactionForm.value.accountId,
  (newAccountId) => {
    if (newAccountId && userChangedAccount.value) {
      store.setDefaultAccount(newAccountId.toString());
    }
    // Reset the flag after first change
    if (!userChangedAccount.value && newAccountId) {
      userChangedAccount.value = true;
    }
  },
);

const handleTransactionSubmit = async () => {
  try {
    if (!transactionForm.value.accountId) {
      throw new Error("Vui lòng chọn tài khoản");
    }
    if (!transactionForm.value.categoryId) {
      throw new Error("Vui lòng chọn danh mục");
    }
    if (transactionForm.value.amount <= 0) {
      throw new Error("Số tiền phải lớn hơn 0");
    }

    const date = moment(
      `${transactionForm.value.dateInput} ${transactionForm.value.timeInput}`,
      "YYYY-MM-DD HH:mm",
    );

    await store.addTransaction({
      ...transactionForm.value,
      accountId: transactionForm.value.accountId.toString(),
      categoryId: transactionForm.value.categoryId.toString(),
      amount: normalizeAmount(transactionForm.value.amount),
      date: date.toISOString(),
    });

    // Set the selected account as default for next transaction
    if (transactionForm.value.accountId) {
      store.setDefaultAccount(transactionForm.value.accountId.toString());
    }

    emit("update:modelValue", false);
    // Reset the transaction form with the current default account
    transactionForm.value = {
      type: "expense",
      accountId: getDefaultAccountId(), // This will get the newly set default
      categoryId: getDefaultCategoryId("expense"),
      amount: 0,
      description: "",
      ...getCurrentDateTime(),
    };

    // Reset the user change flag for the next modal opening
    userChangedAccount.value = false;
  } catch (error) {
    console.error("Error in handleTransactionSubmit:", error);
    alert(error.message);
  }
};

const handleTransferSubmit = async () => {
  try {
    if (!transferForm.value.fromAccount) {
      throw new Error("Vui lòng chọn tài khoản chuyển");
    }
    if (!transferForm.value.toAccount) {
      throw new Error("Vui lòng chọn tài khoản nhận");
    }
    if (transferForm.value.fromAccount === transferForm.value.toAccount) {
      throw new Error("Tài khoản chuyển và nhận không thể giống nhau");
    }
    if (transferForm.value.amount <= 0) {
      throw new Error("Số tiền phải lớn hơn 0");
    }

    const date = moment(
      `${transferForm.value.dateInput} ${transferForm.value.timeInput}`,
      "YYYY-MM-DD HH:mm",
    );

    await store.addTransaction({
      type: "transfer",
      ...transferForm.value,
      fromAccount: transferForm.value.fromAccount.toString(),
      toAccount: transferForm.value.toAccount.toString(),
      amount: normalizeAmount(transferForm.value.amount),
      date: date.toISOString(),
    });

    emit("update:modelValue", false);
    // Reset the transfer form
    transferForm.value = {
      fromAccount: "",
      toAccount: "",
      amount: "",
      ...getCurrentDateTime(),
    };
  } catch (error) {
    console.error("Error in handleTransferSubmit:", error);
    alert(error.message);
  }
};

const handleCreditPaymentSubmit = async () => {
  try {
    if (!creditPaymentForm.value.accountId) {
      throw new Error("Vui lòng chọn thẻ tín dụng");
    }
    if (creditPaymentForm.value.amount <= 0) {
      throw new Error("Số tiền thanh toán phải lớn hơn 0");
    }

    const date = moment(
      `${creditPaymentForm.value.dateInput} ${creditPaymentForm.value.timeInput}`,
      "YYYY-MM-DD HH:mm",
    );

    await store.addTransaction({
      type: "credit_payment",
      accountId: creditPaymentForm.value.accountId.toString(),
      amount: normalizeAmount(creditPaymentForm.value.amount),
      description: "Thanh toán thẻ tín dụng",
      date: date.toISOString(),
    });

    emit("update:modelValue", false);
    creditPaymentForm.value = {
      accountId: "",
      amount: "",
      ...getCurrentDateTime(),
    };
  } catch (error) {
    console.error("Error in handleCreditPaymentSubmit:", error);
    alert(error.message);
  }
};

const handleSubmit = () => {
  if (activeTab.value === 0) {
    handleTransactionSubmit();
  } else if (activeTab.value === 1) {
    handleTransferSubmit();
  } else {
    handleCreditPaymentSubmit();
  }
};
</script>

<style scoped>
.amount-field {
  min-height: 86px;
}

.amount-preview {
  display: block;
  margin-top: 4px;
  padding-left: 2px;
  color: var(--coffee-secondary);
  font-size: 0.92rem;
}

.clearable-field {
  position: relative;
}

.clearable-field :deep(.form-control) {
  padding-right: 2.75rem;
}

.clear-input-button {
  position: absolute;
  top: 37px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--coffee-secondary);
  background: transparent;
}

.clear-input-button:hover {
  color: var(--coffee-primary);
  background-color: rgba(138, 114, 96, 0.12);
}
</style>
