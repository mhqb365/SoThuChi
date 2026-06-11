import { reactive } from "vue";
import { storageService } from "@/services/storage.service";
import { saveToFirestore, isAuthenticated } from "@/services/firebase";

const isCreditAccount = (account) => {
  const name = account?.name?.toLowerCase() || "";
  return account?.type === "credit" || name.includes("thẻ tín dụng");
};

const store = reactive({
  accounts: [],
  categories: [],
  transactions: [],
  defaultAccountId: null,

  autoBackup() {
    if (isAuthenticated.value) {
      const data = {
        accounts: this.accounts,
        categories: this.categories,
        transactions: this.transactions,
        exportDate: new Date().toISOString(),
      };
      saveToFirestore(data).catch((err) =>
        console.error("Auto backup failed:", err),
      );
    }
  },

  isCreditAccount(accountIdOrAccount) {
    const account =
      typeof accountIdOrAccount === "object"
        ? accountIdOrAccount
        : this.accounts.find((a) => a.id === accountIdOrAccount);
    return isCreditAccount(account);
  },

  async initialize() {
    this.accounts = storageService.getItem("accounts", []);
    this.categories = storageService.getItem("categories", []);
    this.transactions = storageService.getItem("transactions", []);

    // Create default accounts if empty
    if (this.accounts.length === 0) {
      this.accounts = [
        {
          id: "acc_1",
          name: "Tiền mặt",
          balance: 0,
          icon: "cil-wallet",
          color: "success",
        },
        {
          id: "acc_2",
          name: "Vietcombank",
          balance: 0,
          icon: "cil-bank",
          color: "primary",
        },
      ];
      storageService.setItem("accounts", this.accounts);
    }

    // Create default categories if empty
    if (this.categories.length === 0) {
      this.categories = [
        {
          id: "cat_1",
          name: "Ăn uống",
          type: "expense",
          icon: "cil-fastfood",
          color: "warning",
        },
        {
          id: "cat_2",
          name: "Di chuyển",
          type: "expense",
          icon: "cil-car-alt",
          color: "info",
        },
        {
          id: "cat_3",
          name: "Mua sắm",
          type: "expense",
          icon: "cil-cart",
          color: "danger",
        },
        {
          id: "cat_4",
          name: "Hóa đơn",
          type: "expense",
          icon: "cil-file",
          color: "secondary",
        },
        {
          id: "cat_5",
          name: "Lương",
          type: "income",
          icon: "cil-money",
          color: "success",
        },
        {
          id: "cat_6",
          name: "Thưởng",
          type: "income",
          icon: "cil-gift",
          color: "primary",
        },
      ];
      storageService.setItem("categories", this.categories);
    }

    // Load default account from localStorage
    const savedDefaultAccountId = localStorage.getItem("defaultAccountId");
    if (
      savedDefaultAccountId &&
      this.accounts.some((a) => a.id === savedDefaultAccountId)
    ) {
      this.defaultAccountId = savedDefaultAccountId;
    } else if (this.accounts.length > 0) {
      this.defaultAccountId = this.accounts[0].id;
      localStorage.setItem("defaultAccountId", this.defaultAccountId);
    }
  },

  // Account methods
  addAccount(account) {
    account.id = Date.now().toString();
    this.accounts.push(account);
    storageService.setItem("accounts", this.accounts);
    this.autoBackup();
  },

  updateAccount(account) {
    const index = this.accounts.findIndex((a) => a.id === account.id);
    if (index !== -1) {
      this.accounts[index] = { ...account };
      storageService.setItem("accounts", this.accounts);
      this.autoBackup();
    } else {
      throw new Error("Tài khoản không tồn tại");
    }
  },

  reorderAccounts(accountIds) {
    const orderById = new Map(accountIds.map((id, index) => [id, index]));

    this.accounts = this.accounts
      .map((account) => ({
        ...account,
        order: orderById.get(account.id) ?? account.order,
      }))
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER),
      );

    storageService.setItem("accounts", this.accounts);
    this.autoBackup();
  },

  deleteAccount(id) {
    const hasTransactions = this.transactions.some(
      (t) => t.accountId === id || t.fromAccount === id || t.toAccount === id,
    );
    if (hasTransactions) {
      throw new Error("Không thể xóa tài khoản đã có giao dịch");
    }

    const index = this.accounts.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.accounts.splice(index, 1);
      storageService.setItem("accounts", this.accounts);
      this.autoBackup();
    }
  },

  // Category methods
  addCategory(category) {
    category.id = Date.now().toString();
    this.categories.push(category);
    storageService.setItem("categories", this.categories);
    this.autoBackup();
  },

  updateCategory(category) {
    const index = this.categories.findIndex((c) => c.id === category.id);
    if (index !== -1) {
      this.categories[index] = { ...category };
      storageService.setItem("categories", this.categories);
      this.autoBackup();
    } else {
      throw new Error("Danh mục không tồn tại");
    }
  },

  deleteCategory(id) {
    const hasTransactions = this.transactions.some((t) => t.categoryId === id);
    if (hasTransactions) {
      throw new Error("Không thể xóa danh mục đã có giao dịch");
    }

    const index = this.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.categories.splice(index, 1);
      storageService.setItem("categories", this.categories);
      this.autoBackup();
    }
  },

  // Transaction methods
  addTransaction(transaction) {
    transaction.id = Date.now().toString();

    // Handle balance updates
    if (transaction.type === "credit_payment") {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (!account) {
        throw new Error("Tài khoản không tồn tại");
      }

      account.balance += transaction.amount;
      storageService.setItem("accounts", this.accounts);
    } else if (transaction.type === "transfer") {
      const fromAccount = this.accounts.find(
        (a) => a.id === transaction.fromAccount,
      );
      const toAccount = this.accounts.find(
        (a) => a.id === transaction.toAccount,
      );

      if (!fromAccount || !toAccount) {
        throw new Error("Tài khoản không tồn tại");
      }

      fromAccount.balance -= transaction.amount;
      toAccount.balance += transaction.amount;
      storageService.setItem("accounts", this.accounts);
    } else {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (!account) {
        throw new Error("Tài khoản không tồn tại");
      }

      if (transaction.type === "expense") {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      storageService.setItem("accounts", this.accounts);
    }

    this.transactions.push(transaction);
    storageService.setItem("transactions", this.transactions);
    this.autoBackup();
  },

  updateTransaction(transaction) {
    const oldTransaction = this.transactions.find(
      (t) => t.id === transaction.id,
    );
    if (!oldTransaction) {
      throw new Error("Giao dịch không tồn tại");
    }

    // Revert old transaction's effect on balances
    if (oldTransaction.type === "credit_payment") {
      const oldAccount = this.accounts.find(
        (a) => a.id === oldTransaction.accountId,
      );
      oldAccount.balance -= oldTransaction.amount;
    } else if (oldTransaction.type === "transfer") {
      const oldFromAccount = this.accounts.find(
        (a) => a.id === oldTransaction.fromAccount,
      );
      const oldToAccount = this.accounts.find(
        (a) => a.id === oldTransaction.toAccount,
      );
      oldFromAccount.balance += oldTransaction.amount;
      oldToAccount.balance -= oldTransaction.amount;
    } else {
      const oldAccount = this.accounts.find(
        (a) => a.id === oldTransaction.accountId,
      );
      if (oldTransaction.type === "expense") {
        oldAccount.balance += oldTransaction.amount;
      } else {
        oldAccount.balance -= oldTransaction.amount;
      }
    }

    // Apply new transaction's effect on balances
    if (transaction.type === "credit_payment") {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (!account) {
        throw new Error("Tài khoản không tồn tại");
      }

      account.balance += transaction.amount;
    } else if (transaction.type === "transfer") {
      const fromAccount = this.accounts.find(
        (a) => a.id === transaction.fromAccount,
      );
      const toAccount = this.accounts.find(
        (a) => a.id === transaction.toAccount,
      );

      if (!fromAccount || !toAccount) {
        throw new Error("Tài khoản không tồn tại");
      }

      fromAccount.balance -= transaction.amount;
      toAccount.balance += transaction.amount;
    } else {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (!account) {
        throw new Error("Tài khoản không tồn tại");
      }

      if (transaction.type === "expense") {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
    }

    // Update transaction and save everything
    const index = this.transactions.findIndex((t) => t.id === transaction.id);
    this.transactions[index] = transaction;
    storageService.setItem("transactions", this.transactions);
    storageService.setItem("accounts", this.accounts);
    this.autoBackup();
  },

  deleteTransaction(id) {
    const transaction = this.transactions.find((t) => t.id === id);
    if (!transaction) {
      throw new Error("Giao dịch không tồn tại");
    }

    // Revert transaction's effect on balances
    if (transaction.type === "credit_payment") {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      account.balance -= transaction.amount;
    } else if (transaction.type === "transfer") {
      const fromAccount = this.accounts.find(
        (a) => a.id === transaction.fromAccount,
      );
      const toAccount = this.accounts.find(
        (a) => a.id === transaction.toAccount,
      );
      fromAccount.balance += transaction.amount;
      toAccount.balance -= transaction.amount;
    } else {
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (transaction.type === "expense") {
        account.balance += transaction.amount;
      } else {
        account.balance -= transaction.amount;
      }
    }

    // Remove transaction and save everything
    const index = this.transactions.findIndex((t) => t.id === id);
    this.transactions.splice(index, 1);
    storageService.setItem("transactions", this.transactions);
    storageService.setItem("accounts", this.accounts);
    this.autoBackup();
  },

  // Add a new action to set the default account
  setDefaultAccount(accountId) {
    this.defaultAccountId = accountId;
    // Save to localStorage or your persistence layer
    localStorage.setItem("defaultAccountId", accountId);
  },
});

export const useStore = () => store;
