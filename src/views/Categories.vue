<template>
  <div class="container-lg categories-page py-4">
    <div class="page-header">
      <h4 class="mb-0">Danh Mục</h4>
      <CButton
        class="action-button"
        color="primary"
        @click="openCategoryModal()"
      >
        <Plus :size="18" aria-hidden="true" />
        <span>Thêm danh mục</span>
      </CButton>
    </div>

    <div class="section-title">Danh mục chi</div>
    <template v-if="expenseCategories.length">
      <div
        v-for="category in expenseCategories"
        :key="category.id"
        class="swipe-row my-3"
      >
        <div
          class="swipe-actions"
          :class="{ 'is-visible': activeSwipeCategoryId === category.id }"
        >
          <CButton
            color="primary"
            class="swipe-action"
            @click.stop="editCategory(category)"
          >
            <Pencil :size="16" aria-hidden="true" />
          </CButton>
          <CButton
            color="danger"
            class="swipe-action"
            @click.stop="deleteCategory(category)"
          >
            <Trash2 :size="16" aria-hidden="true" />
          </CButton>
        </div>
        <CCard
          class="category-item"
          :class="{ 'is-swiped': activeSwipeCategoryId === category.id }"
          @click="handleCategoryClick(category.id)"
          @touchstart.passive="handleTouchStart($event, category.id)"
          @touchmove.passive="handleTouchMove($event)"
          @touchend="handleTouchEnd(category.id)"
        >
          <CCardBody>
            <div class="category-row">
              <div class="category-content">
                <div class="category-icon">
                  <Tag :size="18" aria-hidden="true" />
                </div>
                <div>
                  <h5 class="mb-1">{{ category.name }}</h5>
                  <div class="category-type-badge">
                    {{ category.type === "income" ? "Thu nhập" : "Chi tiêu" }}
                  </div>
                </div>
              </div>
              <div class="desktop-actions">
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="icon-text-button me-2"
                  @click.stop="openCategoryModal(category)"
                >
                  <Pencil :size="15" aria-hidden="true" />
                  <span>Sửa</span>
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  class="icon-text-button"
                  @click.stop="confirmDelete(category)"
                >
                  <Trash2 :size="15" aria-hidden="true" />
                  <span>Xóa</span>
                </CButton>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </template>
    <div v-else class="empty-state">Không có danh mục chi.</div>

    <div class="section-title mt-4">Danh mục thu</div>
    <template v-if="incomeCategories.length">
      <div
        v-for="category in incomeCategories"
        :key="category.id"
        class="swipe-row my-3"
      >
        <div
          class="swipe-actions"
          :class="{ 'is-visible': activeSwipeCategoryId === category.id }"
        >
          <CButton
            color="primary"
            class="swipe-action"
            @click.stop="editCategory(category)"
          >
            <Pencil :size="16" aria-hidden="true" />
          </CButton>
          <CButton
            color="danger"
            class="swipe-action"
            @click.stop="deleteCategory(category)"
          >
            <Trash2 :size="16" aria-hidden="true" />
          </CButton>
        </div>
        <CCard
          class="category-item"
          :class="{ 'is-swiped': activeSwipeCategoryId === category.id }"
          @click="handleCategoryClick(category.id)"
          @touchstart.passive="handleTouchStart($event, category.id)"
          @touchmove.passive="handleTouchMove($event)"
          @touchend="handleTouchEnd(category.id)"
        >
          <CCardBody>
            <div class="category-row">
              <div class="category-content">
                <div class="category-icon">
                  <Tag :size="18" aria-hidden="true" />
                </div>
                <div>
                  <h5 class="mb-1">{{ category.name }}</h5>
                  <div class="category-type-badge">
                    {{ category.type === "income" ? "Thu nhập" : "Chi tiêu" }}
                  </div>
                </div>
              </div>
              <div class="desktop-actions">
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="icon-text-button me-2"
                  @click.stop="openCategoryModal(category)"
                >
                  <Pencil :size="15" aria-hidden="true" />
                  <span>Sửa</span>
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  class="icon-text-button"
                  @click.stop="confirmDelete(category)"
                >
                  <Trash2 :size="15" aria-hidden="true" />
                  <span>Xóa</span>
                </CButton>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </template>
    <div v-else class="empty-state">Không có danh mục thu.</div>

    <CModal
      backdrop="static"
      :visible="showCategoryModal"
      @close="showCategoryModal = false"
    >
      <CModalHeader>
        <CModalTitle>{{
          isEditMode ? "Sửa danh mục" : "Thêm danh mục"
        }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm @submit.prevent="handleCategorySubmit">
          <CFormInput
            v-model="categoryForm.name"
            class="mb-3"
            label="Tên danh mục"
            required
          />
          <CFormSelect
            v-model="categoryForm.type"
            label="Loại"
            :options="[
              { label: 'Thu nhập', value: 'income' },
              { label: 'Chi tiêu', value: 'expense' },
            ]"
            required
          />
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showCategoryModal = false">
          Đóng
        </CButton>
        <CButton color="primary" @click="handleCategorySubmit">
          {{ isEditMode ? "Cập nhật" : "Thêm" }}
        </CButton>
      </CModalFooter>
    </CModal>

    <CModal
      backdrop="static"
      :visible="showConfirmModal"
      @close="showConfirmModal = false"
    >
      <CModalHeader>
        <CModalTitle>Xác nhận xóa</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>Bạn có chắc chắn muốn xóa danh mục "{{ categoryToDelete.name }}"?</p>
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
import { computed, ref } from "vue";
import { Pencil, Plus, Tag, Trash2 } from "@lucide/vue";
import { useStore } from "@/stores";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();
const showCategoryModal = ref(false);
const showConfirmModal = ref(false);
const isEditMode = ref(false);
const categoryToDelete = ref({ id: null, name: "" });
const activeSwipeCategoryId = ref(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDeltaX = ref(0);
const suppressClick = ref(false);

const defaultCategoryForm = {
  id: null,
  name: "",
  type: "expense",
};

const categoryForm = ref({ ...defaultCategoryForm });

const openCategoryModal = (category = null) => {
  if (category) {
    categoryForm.value = { ...category };
    isEditMode.value = true;
  } else {
    categoryForm.value = { ...defaultCategoryForm };
    isEditMode.value = false;
  }

  showCategoryModal.value = true;
};

const handleCategorySubmit = () => {
  try {
    if (isEditMode.value) {
      store.updateCategory(categoryForm.value);
    } else {
      const newCategory = {
        id: Date.now().toString(),
        ...categoryForm.value,
      };

      store.addCategory(newCategory);
    }

    showCategoryModal.value = false;
    categoryForm.value = { ...defaultCategoryForm };
    isEditMode.value = false;
  } catch (error) {
    alert(error.message);
  }
};

const confirmDelete = (category) => {
  categoryToDelete.value = category;
  showConfirmModal.value = true;
};

const editCategory = (category) => {
  activeSwipeCategoryId.value = null;
  openCategoryModal(category);
};

const deleteCategory = (category) => {
  activeSwipeCategoryId.value = null;
  confirmDelete(category);
};

const handleDeleteConfirm = () => {
  try {
    store.deleteCategory(categoryToDelete.value.id);
    showConfirmModal.value = false;
  } catch (error) {
    alert(error.message);
  }
};

const expenseCategories = computed(() =>
  store.categories
    .filter((cat) => cat.type === "expense")
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const incomeCategories = computed(() =>
  store.categories
    .filter((cat) => cat.type === "income")
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const handleCategoryClick = (id) => {
  if (suppressClick.value) {
    return;
  }

  if (activeSwipeCategoryId.value === id) {
    activeSwipeCategoryId.value = null;
    return;
  }

  if (activeSwipeCategoryId.value) {
    activeSwipeCategoryId.value = null;
    return;
  }

  router.push({
    path: "/transactions",
    query: { category: id },
  });
};

const handleTouchStart = (event, id) => {
  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  touchDeltaX.value = 0;

  if (activeSwipeCategoryId.value && activeSwipeCategoryId.value !== id) {
    activeSwipeCategoryId.value = null;
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
    activeSwipeCategoryId.value = id;
    suppressNextClick();
    return;
  }

  if (touchDeltaX.value > 40 && activeSwipeCategoryId.value === id) {
    activeSwipeCategoryId.value = null;
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
.categories-page {
  padding-bottom: 96px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--coffee-space-md);
  margin-bottom: var(--coffee-space-lg);
}

.section-title {
  color: var(--coffee-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.action-button,
.icon-text-button {
  display: inline-flex;
  align-items: center;
  gap: var(--coffee-space-sm);
}

.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: var(--coffee-radius-lg);
}

.category-item {
  position: relative;
  z-index: 1;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  will-change: transform;
}

.category-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgba(43, 24, 16, 0.12);
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--coffee-space-md);
}

.category-content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--coffee-space-md);
}

.category-icon {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(217, 119, 66, 0.2);
  border-radius: 999px;
  background-color: rgba(217, 119, 66, 0.12);
  color: var(--coffee-tertiary);
}

.category-type-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 10px;
  border: 1px solid var(--coffee-border);
  border-radius: 999px;
  color: var(--coffee-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.empty-state {
  margin: var(--coffee-space-md) 0;
  padding: var(--coffee-space-md);
  border: 1px dashed var(--coffee-border);
  border-radius: var(--coffee-radius-lg);
  color: var(--coffee-secondary);
  background-color: rgba(247, 238, 220, 0.45);
}

.swipe-actions {
  display: none;
}

.desktop-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

@media (max-width: 767.98px) {
  .page-header {
    align-items: flex-start;
  }

  .action-button span {
    display: none;
  }

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

  .category-item.is-swiped {
    transform: translateX(-112px);
  }

  .category-item:hover {
    box-shadow: var(--coffee-shadow);
    transform: none;
  }

  .category-item.is-swiped:hover {
    transform: translateX(-112px);
  }
}
</style>
