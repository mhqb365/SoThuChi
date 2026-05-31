<template>
  <CModal backdrop="static" :visible="visible" @close="onClose">
    <CModalHeader>
      <CModalTitle>
        {{
          form.type === "transfer"
            ? "Sửa Chuyển Khoản"
            : form.type === "credit_payment"
              ? "Sửa Thanh Toán Thẻ"
              : "Sửa Giao Dịch"
        }}
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CForm @submit.prevent="handleSubmit">
        <template
          v-if="form.type !== 'transfer' && form.type !== 'credit_payment'"
        >
          <CRow class="mb-3">
            <CCol>
              <CFormSelect
                v-model="form.type"
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
                v-model="form.accountId"
                label="Tài Khoản"
                :options="[
                  { label: 'Chọn tài khoản', value: '' },
                  ...accounts.map((acc) => ({
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
                v-model="form.categoryId"
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
              <CFormInput
                v-model.number="form.amount"
                label="Số Tiền"
                type="number"
                inputmode="numeric"
                required
              />
            </CCol>
          </CRow>

          <CFormInput
            v-model="form.description"
            class="mb-3"
            label="Mô Tả"
            required
          />
        </template>
        <template v-else-if="form.type === 'credit_payment'">
          <CFormSelect
            v-model="form.accountId"
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
          <CFormInput
            v-model.number="form.amount"
            class="mb-3"
            label="Số Tiền Thanh Toán"
            type="number"
            inputmode="numeric"
            required
          />
        </template>
        <template v-else>
          <CFormSelect
            v-model="form.fromAccount"
            label="Từ Tài Khoản"
            :options="[
              { label: 'Chọn tài khoản', value: '' },
              ...accounts.map((acc) => ({
                label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                value: acc.id,
              })),
            ]"
            required
          />
          <CFormSelect
            v-model="form.toAccount"
            label="Đến Tài Khoản"
            :options="[
              { label: 'Chọn tài khoản', value: '' },
              ...accounts.map((acc) => ({
                label: `${acc.name} (${acc.balance.toLocaleString()}đ)`,
                value: acc.id,
              })),
            ]"
            required
          />
        </template>

        <div class="d-flex">
          <CFormInput
            v-model="form.dateInput"
            type="date"
            required
            class="me-2"
          />
          <CFormInput v-model="form.timeInput" type="time" required />
        </div>
      </CForm>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" @click="onClose">Đóng</CButton>
      <CButton color="primary" @click="handleSubmit">Cập Nhật</CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "@/stores";
import moment from "moment";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  transaction: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "submit"]);
const store = useStore();

const form = ref({
  id: "",
  type: "expense",
  accountId: "",
  categoryId: "",
  fromAccount: "",
  toAccount: "",
  amount: "",
  description: "",
  dateInput: "",
  timeInput: "",
});

watch(
  () => props.transaction,
  (newTransaction) => {
    if (newTransaction) {
      const datetime = moment(newTransaction.date);
      form.value = {
        id: newTransaction.id,
        type: newTransaction.type,
        accountId: newTransaction.accountId,
        categoryId: newTransaction.categoryId,
        fromAccount: newTransaction.fromAccount,
        toAccount: newTransaction.toAccount,
        amount: newTransaction.amount,
        description: newTransaction.description,
        dateInput: datetime.format("YYYY-MM-DD"),
        timeInput: datetime.format("HH:mm"),
      };
    }
  },
  { immediate: true },
);

const accounts = computed(() => store.accounts);
const creditAccounts = computed(() =>
  store.accounts.filter((account) => store.isCreditAccount(account)),
);

const filteredCategories = computed(() => {
  return store.categories.filter((cat) => cat.type === form.value.type);
});

const handleTypeChange = () => {
  const defaultCategory = store.categories.find(
    (cat) => cat.type === form.value.type,
  );
  form.value.categoryId = defaultCategory?.id?.toString() || "";
};

const onClose = () => {
  emit("close");
  form.value = {
    id: "",
    type: "expense",
    accountId: "",
    categoryId: "",
    fromAccount: "",
    toAccount: "",
    amount: 0,
    description: "",
    dateInput: "",
    timeInput: "",
  };
};

const handleSubmit = async () => {
  try {
    const date = moment(
      `${form.value.dateInput} ${form.value.timeInput}`,
      "YYYY-MM-DD HH:mm",
    );

    await store.updateTransaction({
      ...form.value,
      date: date.toISOString(),
    });

    emit("submit");
    onClose();
  } catch (error) {
    console.error("Error in handleSubmit:", error);
    alert(error.message);
  }
};

const backspaceAmount = () => {
  if (form.value.amount) {
    const str = form.value.amount.toString();
    form.value.amount = str.length > 1 ? Number(str.slice(0, -1)) : 0;
  }
};
</script>
