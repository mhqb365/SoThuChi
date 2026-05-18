<template>
  <CDropdown>
    <CDropdownToggle color="light">
      {{ selectedLabel }}
    </CDropdownToggle>
    <CDropdownMenu>
      <CDropdownItem
        v-for="option in dateOptions"
        :key="option.value"
        class="cursor"
        @click="selectRange(option)"
      >
        {{ option.label }}
      </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import moment from "moment";

const props = defineProps({
  defaultValue: {
    type: String,
    default: "thisMonth", // 'today', 'thisWeek', 'thisMonth', 'thisQuarter', 'thisYear'
  },
});

const dateOptions = [
  {
    label: "Hôm nay",
    value: "today",
    getRange: () => ({
      start: moment().startOf("day"),
      end: moment().endOf("day"),
    }),
  },
  {
    label: "Hôm qua",
    value: "yesterday",
    getRange: () => ({
      start: moment().subtract(1, "days").startOf("day"),
      end: moment().subtract(1, "days").endOf("day"),
    }),
  },
  {
    label: "Tuần này",
    value: "thisWeek",
    getRange: () => ({
      start: moment().startOf("week"),
      end: moment().endOf("week"),
    }),
  },
  {
    label: "Tuần trước",
    value: "lastWeek",
    getRange: () => ({
      start: moment().subtract(1, "weeks").startOf("week"),
      end: moment().subtract(1, "weeks").endOf("week"),
    }),
  },
  {
    label: "Tháng này",
    value: "thisMonth",
    getRange: () => ({
      start: moment().startOf("month"),
      end: moment().endOf("month"),
    }),
  },
  {
    label: "Tháng trước",
    value: "lastMonth",
    getRange: () => ({
      start: moment().subtract(1, "months").startOf("month"),
      end: moment().subtract(1, "months").endOf("month"),
    }),
  },
  {
    label: "Quý này",
    value: "thisQuarter",
    getRange: () => ({
      start: moment().startOf("quarter"),
      end: moment().endOf("quarter"),
    }),
  },
  {
    label: "Quý trước",
    value: "lastQuarter",
    getRange: () => ({
      start: moment().subtract(1, "quarters").startOf("quarter"),
      end: moment().subtract(1, "quarters").endOf("quarter"),
    }),
  },
  {
    label: "Năm nay",
    value: "thisYear",
    getRange: () => ({
      start: moment().startOf("year"),
      end: moment().endOf("year"),
    }),
  },
  {
    label: "Năm trước",
    value: "lastYear",
    getRange: () => ({
      start: moment().subtract(1, "years").startOf("year"),
      end: moment().subtract(1, "years").endOf("year"),
    }),
  },
];

const selectedOption = ref(dateOptions[0]);

onMounted(() => {
  const defaultOption = dateOptions.find(
    (opt) => opt.value === props.defaultValue,
  );
  if (defaultOption) {
    selectRange(defaultOption);
  }
});

const selectedLabel = computed(() => selectedOption.value.label);

// Expose selectedLabel to parent
defineExpose({ selectedLabel });

const emit = defineEmits(["range-selected"]);

function selectRange(option) {
  selectedOption.value = option;
  const range = option.getRange();
  emit("range-selected", {
    start: range.start.toDate(),
    end: range.end.toDate(),
    rangeType: option.value,
  });
}
</script>
