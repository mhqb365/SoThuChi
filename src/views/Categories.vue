<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Danh Mục</h4>
      <CButton color="primary" @click="openCategoryModal()">
        Thêm Danh Mục
      </CButton>
    </div>

    <!-- Danh mục chi -->
    <div class="fw-bold fs-6">Danh Mục Chi</div>
    <template v-if="expenseCategories.length">
      <div
        v-for="category in expenseCategories"
        :key="category.id"
        class="swipe-row my-3"
      >
        <div class="swipe-actions">
          <CButton
            color="primary"
            class="swipe-action"
            @click.stop="editCategory(category)"
          >
            Sửa
          </CButton>
          <CButton
            color="danger"
            class="swipe-action"
            @click.stop="deleteCategory(category)"
          >
            Xóa
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
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-1">{{ category.name }}</h5>
                <div class="text-medium-emphasis">
                  {{ category.type === "income" ? "Thu Nhập" : "Chi Tiêu" }}
                </div>
              </div>
              <div class="desktop-actions">
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="me-2"
                  @click="openCategoryModal(category)"
                >
                  Sửa
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  @click="confirmDelete(category)"
                >
                  Xóa
                </CButton>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </template>
    <div v-else class="text-medium-emphasis mb-3">Không có danh mục chi.</div>

    <!-- Danh mục thu -->
    <div class="fw-bold fs-6 mb-2 mt-4">Danh Mục Thu</div>
    <template v-if="incomeCategories.length">
      <div
        v-for="category in incomeCategories"
        :key="category.id"
        class="swipe-row my-3"
      >
        <div class="swipe-actions">
          <CButton
            color="primary"
            class="swipe-action"
            @click.stop="editCategory(category)"
          >
            Sửa
          </CButton>
          <CButton
            color="danger"
            class="swipe-action"
            @click.stop="deleteCategory(category)"
          >
            Xóa
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
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-1">{{ category.name }}</h5>
                <div class="text-medium-emphasis">
                  {{ category.type === "income" ? "Thu Nhập" : "Chi Tiêu" }}
                </div>
              </div>
              <div class="desktop-actions">
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="me-2"
                  @click="openCategoryModal(category)"
                >
                  Sửa
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  @click="confirmDelete(category)"
                >
                  Xóa
                </CButton>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </template>
    <div v-else class="text-medium-emphasis mb-3">Không có danh mục thu.</div>

    <!-- Category Modal (Add/Edit) -->
    <CModal
      backdrop="static"
      :visible="showCategoryModal"
      @close="showCategoryModal = false"
    >
      <CModalHeader>
        <CModalTitle>{{
          isEditMode ? "Sửa Danh Mục" : "Thêm Danh Mục"
        }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm @submit.prevent="handleCategorySubmit">
          <CFormInput
            v-model="categoryForm.name"
            class="mb-3"
            label="Tên Danh Mục"
            required
          />
          <CFormSelect
            v-model="categoryForm.type"
            label="Loại"
            :options="[
              { label: 'Thu Nhập', value: 'income' },
              { label: 'Chi Tiêu', value: 'expense' },
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
import { ref, computed } from "vue";
import { useStore } from "@/stores";

const store = useStore();
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

// Open the category modal for either add or edit
const openCategoryModal = (category = null) => {
  if (category) {
    // Edit mode
    categoryForm.value = { ...category };
    isEditMode.value = true;
  } else {
    // Add mode
    categoryForm.value = { ...defaultCategoryForm };
    isEditMode.value = false;
  }
  showCategoryModal.value = true;
};

// Handle both add and update
const handleCategorySubmit = () => {
  try {
    if (isEditMode.value) {
      // Update existing category
      store.updateCategory(categoryForm.value);
    } else {
      // Add new category
      const newCategory = {
        id: Date.now().toString(),
        ...categoryForm.value,
      };

      store.addCategory(newCategory);
    }

    // Close modal and reset form
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
  }
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
.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.category-item {
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
    border-radius: 0 6px 6px 0;
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
}
</style>
