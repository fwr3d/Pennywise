// Money Manager Web App - Static Version
// Works entirely in the browser with localStorage

class MoneyManager {
    constructor() {
        this.transactions = [];
        this.categories = {
            'Income': ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
            'Expense': ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Other']
        };
        this.salaryConfig = {
            enabled: false,
            amount: 0,
            frequency: 'monthly',
            pay_day: 1,
            next_pay_date: null
        };
        this.currentTransactionId = null;
        
        this.init();
    }

    async init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.loadCharts();
    }

    loadData() {
        // Load from localStorage
        const savedTransactions = localStorage.getItem('pennywise_transactions');
        const savedSalaryConfig = localStorage.getItem('pennywise_salary_config');
        
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
        
        if (savedSalaryConfig) {
            this.salaryConfig = JSON.parse(savedSalaryConfig);
        }
    }

    saveData() {
        // Save to localStorage
        localStorage.setItem('pennywise_transactions', JSON.stringify(this.transactions));
        localStorage.setItem('pennywise_salary_config', JSON.stringify(this.salaryConfig));
    }

    setupEventListeners() {
        // Transaction form
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Transaction type change
        document.getElementById('transaction-type').addEventListener('change', (e) => {
            this.updateCategories(e.target.value);
            this.toggleSalaryConfig(e.target.value);
        });

        // Salary enabled toggle
        document.getElementById('salary-enabled').addEventListener('change', (e) => {
            this.toggleSalaryFields(e.target.checked);
        });
    }

    updateCategories(type) {
        const categorySelect = document.getElementById('transaction-category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (type && this.categories[type]) {
            this.categories[type].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    toggleSalaryConfig(type) {
        const salaryConfig = document.getElementById('salary-config');
        if (type === 'Income') {
            salaryConfig.style.display = 'block';
        } else {
            salaryConfig.style.display = 'none';
        }
    }

    toggleSalaryFields(enabled) {
        const salaryFields = document.querySelector('.salary-fields');
        salaryFields.style.display = enabled ? 'block' : 'none';
    }

    saveTransaction() {
        const formData = new FormData(document.getElementById('transaction-form'));
        const transaction = Object.fromEntries(formData.entries());
        
        // Convert amount to number
        transaction.amount = parseFloat(transaction.amount);
        
        // Add ID and timestamp
        if (this.currentTransactionId) {
            // Update existing transaction
            const index = this.transactions.findIndex(t => t.id === this.currentTransactionId);
            if (index !== -1) {
                transaction.id = this.currentTransactionId;
                transaction.timestamp = this.transactions[index].timestamp;
                this.transactions[index] = transaction;
            }
        } else {
            // Add new transaction
            transaction.id = Date.now(); // Use timestamp as ID
            transaction.timestamp = new Date().toISOString();
            this.transactions.push(transaction);
        }
        
        // Save salary config if it was updated
        if (transaction.type === 'Income' && document.getElementById('salary-enabled').checked) {
            this.salaryConfig = {
                enabled: true,
                amount: parseFloat(document.getElementById('salary-amount').value) || 0,
                frequency: document.getElementById('salary-frequency').value,
                pay_day: parseInt(document.getElementById('salary-pay-day').value) || 1,
                next_pay_date: this.salaryConfig.next_pay_date
            };
        }
        
        this.saveData();
        this.showToast('Transaction saved successfully!', 'success');
        this.closeTransactionModal();
        this.updateDisplay();
        this.loadCharts();
    }

    loadCharts() {
        this.createExpenseChart();
        this.createMonthlyChart();
    }

    createExpenseChart() {
        const expenseTransactions = this.transactions.filter(t => t.type === 'Expense');
        
        if (expenseTransactions.length === 0) {
            document.getElementById('expense-chart').innerHTML = '<div class="no-data">No expense data available</div>';
            return;
        }
        
        // Group by category
        const categoryData = {};
        expenseTransactions.forEach(transaction => {
            const category = transaction.category || 'Other';
            categoryData[category] = (categoryData[category] || 0) + transaction.amount;
        });
        
        const data = [{
            values: Object.values(categoryData),
            labels: Object.keys(categoryData),
            type: 'pie',
            hole: 0.3,
            textinfo: 'label+percent',
            textfont: { size: 12 }
        }];
        
        const layout = {
            title: 'Expense Breakdown',
            font: { size: 14 },
            height: 400
        };
        
        Plotly.newPlot('expense-chart', data, layout);
    }

    createMonthlyChart() {
        // Group transactions by month
        const monthlyData = {};
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.timestamp);
            const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expenses: 0 };
            }
            
            if (transaction.type === 'Income') {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expenses += transaction.amount;
            }
        });
        
        if (Object.keys(monthlyData).length === 0) {
            document.getElementById('monthly-chart').innerHTML = '<div class="no-data">No spending data available</div>';
            return;
        }
        
        const sortedMonths = Object.keys(monthlyData).sort();
        const incomeValues = sortedMonths.map(month => monthlyData[month].income);
        const expenseValues = sortedMonths.map(month => monthlyData[month].expenses);
        
        const data = [
            {
                x: sortedMonths,
                y: incomeValues,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Income',
                line: { color: '#10B981', width: 3 },
                marker: { size: 8 }
            },
            {
                x: sortedMonths,
                y: expenseValues,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Expenses',
                line: { color: '#EF4444', width: 3 },
                marker: { size: 8 }
            }
        ];
        
        const layout = {
            title: 'Income vs Expenses Over Time',
            xaxis: { title: 'Month' },
            yaxis: { title: 'Amount ($)' },
            font: { size: 14 },
            height: 400,
            hovermode: 'x unified'
        };
        
        Plotly.newPlot('monthly-chart', data, layout);
    }

    updateDisplay() {
        this.updateSummaryCards();
        this.updateTransactionsList();
    }

    updateSummaryCards() {
        // Calculate totals
        const totalIncome = this.transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = this.transactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = totalIncome - totalExpenses;
        
        // Calculate monthly totals
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlyIncome = this.transactions
            .filter(t => t.type === 'Income' && t.timestamp.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = this.transactions
            .filter(t => t.type === 'Expense' && t.timestamp.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Update DOM
        document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
        document.getElementById('monthly-income').textContent = `This month: $${monthlyIncome.toFixed(2)}`;
        document.getElementById('monthly-expenses').textContent = `This month: $${monthlyExpenses.toFixed(2)}`;
        
        // Update balance status
        const balanceStatus = document.getElementById('balance-status');
        if (balance > 0) {
            balanceStatus.textContent = 'Positive';
            balanceStatus.className = 'subtitle positive';
        } else if (balance < 0) {
            balanceStatus.textContent = 'Negative';
            balanceStatus.className = 'subtitle negative';
        } else {
            balanceStatus.textContent = 'Neutral';
            balanceStatus.className = 'subtitle neutral';
        }
    }

    updateTransactionsList() {
        const container = document.getElementById('transactions-list');
        
        // Get recent transactions (last 10)
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions yet. Add your first transaction!</div>';
            return;
        }
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type.toLowerCase()}">
                <div class="transaction-icon">
                    <i class="fas fa-${transaction.type === 'Income' ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'Income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon" onclick="moneyManager.editTransaction(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="moneyManager.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    openTransactionModal(transactionId = null) {
        this.currentTransactionId = transactionId;
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        
        if (transactionId) {
            // Edit mode
            document.getElementById('modal-title').textContent = 'Edit Transaction';
            const transaction = this.transactions.find(t => t.id === transactionId);
            if (transaction) {
                form.type.value = transaction.type;
                form.category.value = transaction.category;
                form.amount.value = transaction.amount;
                form.description.value = transaction.description;
                form.date.value = new Date(transaction.timestamp).toISOString().split('T')[0];
            }
        } else {
            // Add mode
            document.getElementById('modal-title').textContent = 'Add Transaction';
            form.reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        }
        
        modal.style.display = 'flex';
        this.updateCategories(form.type.value);
        this.toggleSalaryConfig(form.type.value);
    }

    closeTransactionModal() {
        document.getElementById('transaction-modal').style.display = 'none';
        this.currentTransactionId = null;
    }

    editTransaction(id) {
        this.openTransactionModal(id);
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.showToast('Transaction deleted successfully!', 'success');
            this.updateDisplay();
            this.loadCharts();
        }
    }

    refreshData() {
        this.loadData();
        this.updateDisplay();
        this.loadCharts();
        this.showToast('Data refreshed!', 'success');
    }

    exportData() {
        if (this.transactions.length === 0) {
            this.showToast('No data to export', 'warning');
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                new Date(t.timestamp).toLocaleDateString(),
                t.type,
                t.category,
                `"${t.description}"`,
                t.amount
            ].join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully!', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.getElementById('toast-container').contains(toast)) {
                    document.getElementById('toast-container').removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function openTransactionModal() {
    moneyManager.openTransactionModal();
}

function closeTransactionModal() {
    moneyManager.closeTransactionModal();
}

function refreshData() {
    moneyManager.refreshData();
}

function exportData() {
    moneyManager.exportData();
}

// Initialize the app
let moneyManager;
document.addEventListener('DOMContentLoaded', () => {
    moneyManager = new MoneyManager();
});