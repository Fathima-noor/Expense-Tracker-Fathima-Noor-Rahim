const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");

const submitBtn = document.getElementById("submitBtn");
const errorMessage = document.getElementById("errorMessage");

const monthSelector = document.getElementById("monthSelector");
const selectedMonth = document.getElementById("selectedMonth");
const monthlyExpense = document.getElementById("monthlyExpense");

const categoryChart = document.getElementById("categoryChart");

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let editId = null;

const today = new Date().toISOString().split("T")[0];

dateInput.value = today;

monthSelector.value = today.substring(0, 7);

form.addEventListener("submit", function (event) {
    event.preventDefault();

    clearError();

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!type) {
        showError("Please select transaction type.");
        typeInput.focus();
        return;
    }

    if (!amount || amount <= 0) {
        showError("Please enter a valid amount greater than 0.");
        amountInput.focus();
        return;
    }

    if (!category) {
        showError("Please select a category.");
        categoryInput.focus();
        return;
    }

    if (!date) {
        showError("Please select a transaction date.");
        dateInput.focus();
        return;
    }

    if (!description) {
        showError("Please enter a description.");
        descriptionInput.focus();
        return;
    }

    if (description.length < 2) {
        showError("Description must contain at least 2 characters.");
        descriptionInput.focus();
        return;
    }

    if (editId !== null) {
        transactions = transactions.map(function (transaction) {
            if (transaction.id === editId) {
                return {
                    id: editId,
                    type: type,
                    amount: amount,
                    category: category,
                    date: date,
                    description: description
                };
            }

            return transaction;
        });

        editId = null;
        submitBtn.innerHTML = "+ &nbsp; Add Transaction";
    } else {
        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            date: date,
            description: description
        };

        transactions.push(transaction);
    }

    saveTransactions();

    form.reset();

    dateInput.value = today;

    clearError();

    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateCategoryChart();
});

function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const filteredTransactions = transactions.filter(
        function (transaction) {
            const typeMatch =
                filterType.value === "all" ||
                transaction.type === filterType.value;

            const categoryMatch =
                filterCategory.value === "all" ||
                transaction.category === filterCategory.value;

            return typeMatch && categoryMatch;
        }
    );

    if (filteredTransactions.length === 0) {
        emptyMessage.style.display = "block";
    } else {
        emptyMessage.style.display = "none";
    }

    filteredTransactions
        .slice()
        .sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        })
        .forEach(function (transaction) {
            const div = document.createElement("div");

            div.className = "transaction";

            const sign =
                transaction.type === "income" ? "+" : "-";

            div.innerHTML = `
                <div class="transaction-info">
                    <h3>${escapeHTML(transaction.description)}</h3>
                    <p>
                        ${escapeHTML(transaction.category)}
                        &nbsp; • &nbsp;
                        ${transaction.date}
                    </p>

                    <div class="actions">
                        <button
                            class="edit-btn"
                            onclick="editTransaction(${transaction.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteTransaction(${transaction.id})"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div class="transaction-amount ${transaction.type}">
                    ${sign} ₹${transaction.amount.toFixed(2)}
                </div>
            `;

            transactionList.appendChild(div);
        });
}

function updateSummary() {
    let income = 0;
    let expense = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }
    });

    const currentBalance = income - expense;

    totalIncome.textContent =
        "₹" + income.toFixed(2);

    totalExpense.textContent =
        "₹" + expense.toFixed(2);

    balance.textContent =
        "₹" + currentBalance.toFixed(2);
}

function editTransaction(id) {
    const transaction = transactions.find(
        function (item) {
            return item.id === id;
        }
    );

    if (!transaction) {
        return;
    }

    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;

    editId = id;

    submitBtn.innerHTML = "Update Transaction";

    clearError();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(
        function (transaction) {
            return transaction.id !== id;
        }
    );

    saveTransactions();

    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateCategoryChart();
}

filterType.addEventListener(
    "change",
    displayTransactions
);

filterCategory.addEventListener(
    "change",
    displayTransactions
);

monthSelector.addEventListener(
    "change",
    updateMonthlySummary
);

function updateMonthlySummary() {
    const selected = monthSelector.value;

    if (!selected) {
        selectedMonth.textContent = "-";
        monthlyExpense.textContent = "₹0.00";
        return;
    }

    const monthExpenses = transactions
        .filter(function (transaction) {
            return (
                transaction.type === "expense" &&
                transaction.date.startsWith(selected)
            );
        })
        .reduce(function (total, transaction) {
            return total + transaction.amount;
        }, 0);

    const [year, month] = selected.split("-");

    const date = new Date(
        Number(year),
        Number(month) - 1
    );

    const formattedMonth = date.toLocaleString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    selectedMonth.textContent = formattedMonth;

    monthlyExpense.textContent =
        "₹" + monthExpenses.toFixed(2);
}

function updateCategoryChart() {
    categoryChart.innerHTML = "";

    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        if (transaction.type !== "expense") {
            return;
        }

        if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = 0;
        }

        categoryTotals[transaction.category] +=
            transaction.amount;
    });

    const categories = Object.keys(categoryTotals);

    if (categories.length === 0) {
        categoryChart.innerHTML = `
            <div class="chart-empty">
                No expense data available yet.
            </div>
        `;

        return;
    }

    const maxValue = Math.max(
        ...Object.values(categoryTotals)
    );

    categories
        .sort(function (a, b) {
            return categoryTotals[b] - categoryTotals[a];
        })
        .forEach(function (category) {
            const amount = categoryTotals[category];

            const percentage =
                (amount / maxValue) * 100;

            const row = document.createElement("div");

            row.className = "chart-row";

            row.innerHTML = `
                <div class="chart-label">
                    <span>${escapeHTML(category)}</span>
                    <strong>₹${amount.toFixed(2)}</strong>
                </div>

                <div class="chart-bar-container">
                    <div
                        class="chart-bar"
                        style="width: ${percentage}%"
                    ></div>
                </div>
            `;

            categoryChart.appendChild(row);
        });
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
}

function escapeHTML(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

displayTransactions();
updateSummary();
updateMonthlySummary();
updateCategoryChart();