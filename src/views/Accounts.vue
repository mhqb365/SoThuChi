<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Tài Khoản</h4>
      <CButton color="primary" @click="openAccountModal()">
        Thêm Tài Khoản
      </CButton>
    </div>

    <!-- Total Balance Summary -->
    <CCard class="mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 text-medium-emphasis">Tổng Số Dư</h6>
            <h4
              class="mb-0"
              :class="{
                'text-danger': totalBalance < 0,
                'text-success': totalBalance > 0,
              }"
            >
              {{ totalBalance.toLocaleString() }}đ
            </h4>
          </div>
          <div class="text-medium-emphasis">
            {{ store.accounts.length }} tài khoản
          </div>
        </div>
      </CCardBody>
    </CCard>

    <div
      v-for="account in sortedAccounts"
      :key="account.id"
      class="account-swipe-row my-3"
      :class="{
        'is-dragging': draggingAccountId === account.id,
        'is-drag-over': dragOverAccountId === account.id,
      }"
      draggable="true"
      @dragstart="handleDragStart($event, account.id)"
      @dragover.prevent="handleDragOver(account.id)"
      @dragenter.prevent="handleDragOver(account.id)"
      @drop.prevent="handleDrop(account.id)"
      @dragend="handleDragEnd"
    >
      <div
        class="swipe-actions"
        :class="{ 'is-visible': activeSwipeAccountId === account.id }"
      >
        <CButton
          color="primary"
          class="swipe-action"
          @click.stop="editAccount(account)"
        >
          Sửa
        </CButton>
        <CButton
          color="danger"
          class="swipe-action"
          @click.stop="deleteAccount(account)"
        >
          Xóa
        </CButton>
      </div>
      <CCard
        class="cursor-pointer account-item"
        :class="{ 'is-swiped': activeSwipeAccountId === account.id }"
        @click.stop="handleAccountClick(account)"
        @touchstart.passive="handleTouchStart($event, account.id)"
        @touchmove.passive="handleTouchMove($event)"
        @touchend="handleTouchEnd(account.id)"
      >
        <CCardBody>
          <div class="d-flex justify-content-between align-items-center">
            <div class="account-info">
              <h5 class="mb-1">{{ account.name }}</h5>
              <div class="text-medium-emphasis">{{ account.description }}</div>
            </div>
            <div class="d-flex align-items-center">
              <h4
                class="account-balance mb-0 me-3"
                :class="{ 'text-danger': account.balance < 0 }"
              >
                {{ account.balance.toLocaleString() }}đ
              </h4>
              <div class="desktop-account-actions">
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="me-2"
                  @click.stop="openAccountModal(account)"
                >
                  Sửa
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  @click.stop="confirmDelete(account)"
                >
                  Xóa
                </CButton>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <!-- Account Modal (Add/Edit) -->
    <CModal
      backdrop="static"
      :visible="showAccountModal"
      @close="showAccountModal = false"
    >
      <CModalHeader>
        <CModalTitle>{{
          isEditMode ? "Sửa Tài Khoản" : "Thêm Tài Khoản"
        }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm @submit.prevent="handleAccountSubmit">
          <CFormInput
            v-model="accountForm.name"
            class="mb-3"
            label="Tên Tài Khoản"
            required
          />
          <CFormInput
            v-model.number="accountForm.balance"
            class="mb-3"
            label="Số Dư"
            type="number"
            inputmode="numeric"
            required
          />
          <CFormInput
            v-model="accountForm.description"
            class="mb-3"
            label="Mô Tả"
          />
          <CFormSelect
            v-model="accountForm.type"
            class="mb-3"
            label="Loại Tài Khoản"
            :options="[
              { label: 'Tài khoản thường', value: 'regular' },
              { label: 'Thẻ tín dụng', value: 'credit' },
            ]"
          />

          <CFormCheck
            id="defaultAccountCheckbox"
            v-model="isDefaultAccount"
            label="Đặt làm tài khoản mặc định"
          />
          <small class="form-text text-muted">
            Tài khoản mặc định sẽ được tự động chọn khi tạo giao dịch mới
          </small>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showAccountModal = false">
          Đóng
        </CButton>
        <CButton color="primary" @click="handleAccountSubmit">
          {{ isEditMode ? "Cập Nhật" : "Thêm" }}
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Confirm Delete Modal -->
    <CModal
      backdrop="static"
      :visible="showConfirmModal"
      @close="showConfirmModal = false"
    >
      <CModalHeader>
        <CModalTitle>Xác Nhận Xóa</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>Bạn có chắc chắn muốn xóa tài khoản "{{ accountToDelete.name }}"?</p>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showConfirmModal = false">
          Hủy
        </CButton>
        <CButton color="danger" @click="handleDeleteConfirm">Xóa</CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "@/stores";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();
const showAccountModal = ref(false);
const showConfirmModal = ref(false);
const accountToDelete = ref({ id: null, name: "" });
const isEditMode = ref(false);
const isDefaultAccount = ref(false);
const activeSwipeAccountId = ref(null);
const draggingAccountId = ref(null);
const dragOverAccountId = ref(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDeltaX = ref(0);
const suppressClick = ref(false);

// Computed property for total balance
const totalBalance = computed(() => {
  return store.accounts
    .filter((account) => !store.isCreditAccount(account))
    .reduce((total, account) => total + account.balance, 0);
});

const sortedAccounts = computed(() => {
  const hasCustomOrder = store.accounts.some((account) =>
    Number.isFinite(account.order),
  );

  if (hasCustomOrder) {
    return [...store.accounts].sort((a, b) => {
      const orderDiff =
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER);

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
    });
  }

  return [...store.accounts].sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" }),
  );
});

const defaultAccountForm = {
  id: null,
  name: "",
  description: "",
  balance: 0,
  type: "regular",
};

const accountForm = ref({ ...defaultAccountForm });

// Open the account modal for either add or edit
const openAccountModal = (account = null) => {
  if (account) {
    // Edit mode
    accountForm.value = {
      ...account,
      type: store.isCreditAccount(account)
        ? "credit"
        : account.type || "regular",
    };
    isEditMode.value = true;
    // Check if this account is the default
    isDefaultAccount.value = store.defaultAccountId === account.id.toString();
  } else {
    // Add mode
    accountForm.value = { ...defaultAccountForm };
    isEditMode.value = false;
    isDefaultAccount.value = false;
  }
  showAccountModal.value = true;
};

// Handle both add and update
const handleAccountSubmit = () => {
  try {
    if (isEditMode.value) {
      // Update existing account
      store.updateAccount(accountForm.value);

      // Handle default account setting
      if (isDefaultAccount.value) {
        store.setDefaultAccount(accountForm.value.id.toString());
      } else if (store.defaultAccountId === accountForm.value.id.toString()) {
        // If this was the default but checkbox is unchecked, clear default
        store.setDefaultAccount("");
      }
    } else {
      // Add new account
      const newAccount = {
        id: Date.now().toString(),
        ...accountForm.value,
      };

      store.addAccount(newAccount);

      // Set as default if checkbox is checked
      if (isDefaultAccount.value) {
        store.setDefaultAccount(newAccount.id.toString());
      }
    }

    // Close modal and reset form
    showAccountModal.value = false;
    accountForm.value = { ...defaultAccountForm };
    isEditMode.value = false;
    isDefaultAccount.value = false;
  } catch (error) {
    alert(error.message);
  }
};

const confirmDelete = (account) => {
  accountToDelete.value = account;
  showConfirmModal.value = true;
};

const editAccount = (account) => {
  activeSwipeAccountId.value = null;
  openAccountModal(account);
};

const deleteAccount = (account) => {
  activeSwipeAccountId.value = null;
  confirmDelete(account);
};

const handleDeleteConfirm = () => {
  try {
    // Check if this account is the default account
    if (store.defaultAccountId === accountToDelete.value.id.toString()) {
      store.setDefaultAccount("");
    }

    store.deleteAccount(accountToDelete.value.id);
    showConfirmModal.value = false;
  } catch (error) {
    alert(error.message);
  }
};

// Navigate to transactions page with account filter
const viewAccountTransactions = (accountId) => {
  router.push({
    path: "/transactions",
    query: { account: accountId },
  });
};

const handleAccountClick = (account) => {
  if (suppressClick.value) {
    return;
  }

  if (activeSwipeAccountId.value === account.id) {
    activeSwipeAccountId.value = null;
    return;
  }

  if (activeSwipeAccountId.value) {
    activeSwipeAccountId.value = null;
    return;
  }

  viewAccountTransactions(account.id);
};

const handleDragStart = (event, accountId) => {
  draggingAccountId.value = accountId;
  dragOverAccountId.value = accountId;
  activeSwipeAccountId.value = null;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", accountId);
};

const handleDragOver = (accountId) => {
  if (!draggingAccountId.value || draggingAccountId.value === accountId) {
    return;
  }

  dragOverAccountId.value = accountId;
};

const handleDrop = (targetAccountId) => {
  const sourceAccountId = draggingAccountId.value;

  if (!sourceAccountId || sourceAccountId === targetAccountId) {
    handleDragEnd();
    return;
  }

  const reorderedAccounts = [...sortedAccounts.value];
  const sourceIndex = reorderedAccounts.findIndex(
    (account) => account.id === sourceAccountId,
  );
  const targetIndex = reorderedAccounts.findIndex(
    (account) => account.id === targetAccountId,
  );

  if (sourceIndex === -1 || targetIndex === -1) {
    handleDragEnd();
    return;
  }

  const [movedAccount] = reorderedAccounts.splice(sourceIndex, 1);
  reorderedAccounts.splice(targetIndex, 0, movedAccount);

  store.reorderAccounts(reorderedAccounts.map((account) => account.id));
  suppressNextClick();
  handleDragEnd();
};

const handleDragEnd = () => {
  draggingAccountId.value = null;
  dragOverAccountId.value = null;
};

const handleTouchStart = (event, accountId) => {
  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  touchDeltaX.value = 0;

  if (activeSwipeAccountId.value && activeSwipeAccountId.value !== accountId) {
    activeSwipeAccountId.value = null;
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

const handleTouchEnd = (accountId) => {
  if (touchDeltaX.value < -40) {
    activeSwipeAccountId.value = accountId;
    suppressNextClick();
    return;
  }

  if (touchDeltaX.value > 40 && activeSwipeAccountId.value === accountId) {
    activeSwipeAccountId.value = null;
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
.account-swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.account-swipe-row.is-dragging {
  opacity: 0.55;
}

.account-swipe-row.is-drag-over .account-item {
  outline: 2px solid var(--cui-primary);
  outline-offset: 2px;
}

.account-item {
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
  will-change: transform;
}

.account-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

.swipe-actions {
  display: none;
}

.desktop-account-actions {
  display: flex;
  align-items: center;
}

.account-info {
  min-width: 0;
}

.account-balance {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 767.98px) {
  .account-swipe-row {
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

  .desktop-account-actions {
    display: none;
  }

  .account-item {
    margin-bottom: 0;
    box-shadow: none;
  }

  .account-item.is-swiped {
    transform: translateX(-112px);
  }

  .account-item:hover {
    background-color: var(--cui-card-bg);
    box-shadow: none;
    transform: none;
  }

  .account-item.is-swiped:hover {
    transform: translateX(-112px);
  }
}
</style>
