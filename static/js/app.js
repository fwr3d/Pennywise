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
        this.budgets = {};
        this.savingsGoals = [];
        this.recurringTransactions = [];
        this.settings = {
            darkMode: false,
            currency: 'USD',
            notifications: true,
            autoBackup: true
        };
        this.currentTransactionId = null;
        this.notificationPermission = false;
        
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
        const savedBudgets = localStorage.getItem('pennywise_budgets');
        const savedSavingsGoals = localStorage.getItem('pennywise_savings_goals');
        const savedRecurring = localStorage.getItem('pennywise_recurring');
        const savedSettings = localStorage.getItem('pennywise_settings');
        
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
        
        if (savedSalaryConfig) {
            this.salaryConfig = JSON.parse(savedSalaryConfig);
        }
        
        if (savedBudgets) {
            this.budgets = JSON.parse(savedBudgets);
        }
        
        if (savedSavingsGoals) {
            this.savingsGoals = JSON.parse(savedSavingsGoals);
        }
        
        if (savedRecurring) {
            this.recurringTransactions = JSON.parse(savedRecurring);
        }
        
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Apply dark mode if enabled
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        // Request notification permission
        this.requestNotificationPermission();
    }

    saveData() {
        // Save to localStorage
        localStorage.setItem('pennywise_transactions', JSON.stringify(this.transactions));
        localStorage.setItem('pennywise_salary_config', JSON.stringify(this.salaryConfig));
        localStorage.setItem('pennywise_budgets', JSON.stringify(this.budgets));
        localStorage.setItem('pennywise_savings_goals', JSON.stringify(this.savingsGoals));
        localStorage.setItem('pennywise_recurring', JSON.stringify(this.recurringTransactions));
        localStorage.setItem('pennywise_settings', JSON.stringify(this.settings));
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

        // Budget form
        document.getElementById('budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.addBudget(formData.get('category'), formData.get('amount'), formData.get('period'));
            e.target.reset();
            this.closeBudgetModal();
        });

        // Goal form
        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.addSavingsGoal(formData.get('name'), formData.get('amount'), formData.get('date'));
            e.target.reset();
            this.closeGoalModal();
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
        this.updateBudgetsDisplay();
        this.updateGoalsDisplay();
        this.updateBudgetSpending();
        this.updateSavingsGoals();
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

    updateBudgetsDisplay() {
        const container = document.getElementById('budgets-grid');
        
        if (Object.keys(this.budgets).length === 0) {
            container.innerHTML = '<div class="empty-state">No budgets set. Create your first budget!</div>';
            return;
        }
        
        container.innerHTML = Object.entries(this.budgets).map(([category, budget]) => {
            const status = this.getBudgetStatus(category);
            if (!status) return '';
            
            return `
                <div class="budget-card">
                    <div class="budget-header">
                        <div class="budget-category">${category}</div>
                        <div class="budget-status ${status.status}">
                            ${status.status === 'over' ? 'Over Budget' : 
                              status.status === 'warning' ? 'Warning' : 'On Track'}
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-bar">
                            <div class="budget-fill ${status.status}" style="width: ${Math.min(status.percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="budget-amounts">
                        <span>$${status.spent.toFixed(2)} spent</span>
                        <span>$${status.remaining.toFixed(2)} remaining</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateGoalsDisplay() {
        const container = document.getElementById('goals-grid');
        
        if (this.savingsGoals.length === 0) {
            container.innerHTML = '<div class="empty-state">No savings goals set. Create your first goal!</div>';
            return;
        }
        
        container.innerHTML = this.savingsGoals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-date">${new Date(goal.targetDate).toLocaleDateString()}</div>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-bar">
                            <div class="goal-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="goal-amounts">
                        <span>$${goal.currentAmount.toFixed(2)} / $${goal.targetAmount.toFixed(2)}</span>
                        <span class="goal-percentage">${percentage.toFixed(1)}%</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.5rem;">
                        ${daysLeft > 0 ? `${daysLeft} days left` : 'Goal reached!'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== NEW ENHANCED FEATURES =====

    // Budget Management
    addBudget(category, amount, period = 'monthly') {
        this.budgets[category] = {
            amount: parseFloat(amount),
            period: period,
            spent: 0,
            created: new Date().toISOString()
        };
        this.saveData();
        this.showToast(`Budget set for ${category}: $${amount}`, 'success');
        this.updateDisplay();
    }

    updateBudgetSpending() {
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        Object.keys(this.budgets).forEach(category => {
            const spent = this.transactions
                .filter(t => t.type === 'Expense' && 
                           t.category === category && 
                           t.timestamp.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);
            
            this.budgets[category].spent = spent;
        });
        
        this.saveData();
    }

    getBudgetStatus(category) {
        const budget = this.budgets[category];
        if (!budget) return null;
        
        const percentage = (budget.spent / budget.amount) * 100;
        return {
            spent: budget.spent,
            limit: budget.amount,
            remaining: budget.amount - budget.spent,
            percentage: percentage,
            status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
        };
    }

    // Savings Goals
    addSavingsGoal(name, targetAmount, targetDate) {
        const goal = {
            id: Date.now(),
            name: name,
            targetAmount: parseFloat(targetAmount),
            targetDate: targetDate,
            currentAmount: 0,
            created: new Date().toISOString()
        };
        
        this.savingsGoals.push(goal);
        this.saveData();
        this.showToast(`Savings goal "${name}" created!`, 'success');
        this.updateDisplay();
    }

    updateSavingsGoals() {
        this.savingsGoals.forEach(goal => {
            const savedAmount = this.transactions
                .filter(t => t.type === 'Income' && 
                           t.description.toLowerCase().includes('savings'))
                .reduce((sum, t) => sum + t.amount, 0);
            
            goal.currentAmount = savedAmount;
        });
        
        this.saveData();
    }

    // Recurring Transactions
    addRecurringTransaction(transaction, frequency, nextDate) {
        const recurring = {
            id: Date.now(),
            ...transaction,
            frequency: frequency,
            nextDate: nextDate,
            created: new Date().toISOString()
        };
        
        this.recurringTransactions.push(recurring);
        this.saveData();
        this.showToast('Recurring transaction added!', 'success');
    }

    processRecurringTransactions() {
        const today = new Date().toISOString().split('T')[0];
        
        this.recurringTransactions.forEach(recurring => {
            if (recurring.nextDate <= today) {
                // Create transaction
                const transaction = {
                    id: Date.now(),
                    type: recurring.type,
                    amount: recurring.amount,
                    category: recurring.category,
                    description: recurring.description + ' (Recurring)',
                    timestamp: new Date().toISOString()
                };
                
                this.transactions.push(transaction);
                
                // Update next date
                const nextDate = new Date(recurring.nextDate);
                switch (recurring.frequency) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                }
                
                recurring.nextDate = nextDate.toISOString().split('T')[0];
            }
        });
        
        this.saveData();
        this.updateDisplay();
    }

    // Dark Mode Toggle
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('dark-mode', this.settings.darkMode);
        this.saveData();
        this.showToast(`Dark mode ${this.settings.darkMode ? 'enabled' : 'disabled'}`, 'success');
    }

    // Notifications
    async requestNotificationPermission() {
        if ('Notification' in window && this.settings.notifications) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
        }
    }

    showNotification(title, body, icon = null) {
        if (this.notificationPermission && this.settings.notifications) {
            new Notification(title, {
                body: body,
                icon: icon || '/favicon.ico'
            });
        }
    }

    // Data Import/Export
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.transactions) this.transactions = data.transactions;
                if (data.budgets) this.budgets = data.budgets;
                if (data.savingsGoals) this.savingsGoals = data.savingsGoals;
                if (data.settings) this.settings = { ...this.settings, ...data.settings };
                
                this.saveData();
                this.updateDisplay();
                this.loadCharts();
                this.showToast('Data imported successfully!', 'success');
            } catch (error) {
                this.showToast('Error importing data. Please check file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    exportAllData() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            savingsGoals: this.savingsGoals,
            salaryConfig: this.salaryConfig,
            recurringTransactions: this.recurringTransactions,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pennywise_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Complete data backup exported!', 'success');
    }

    // Advanced Analytics
    getSpendingInsights() {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().substring(0, 7);
        
        const currentMonthExpenses = this.transactions
            .filter(t => t.type === 'Expense' && t.timestamp.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const lastMonthExpenses = this.transactions
            .filter(t => t.type === 'Expense' && t.timestamp.startsWith(lastMonthStr))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const change = lastMonthExpenses > 0 ? 
            ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
        
        return {
            currentMonth: currentMonthExpenses,
            lastMonth: lastMonthExpenses,
            change: change,
            trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
        };
    }

    // Auto-backup
    enableAutoBackup() {
        if (this.settings.autoBackup) {
            setInterval(() => {
                this.exportAllData();
            }, 24 * 60 * 60 * 1000); // Daily backup
        }
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

function exportAllData() {
    moneyManager.exportAllData();
}

// Budget functions
function openBudgetModal() {
    const modal = document.getElementById('budget-modal');
    const categorySelect = document.getElementById('budget-category');
    
    // Populate categories
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    moneyManager.categories.Expense.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    modal.style.display = 'flex';
}

function closeBudgetModal() {
    document.getElementById('budget-modal').style.display = 'none';
}

// Goal functions
function openGoalModal() {
    document.getElementById('goal-modal').style.display = 'flex';
}

function closeGoalModal() {
    document.getElementById('goal-modal').style.display = 'none';
}

// Settings functions
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    document.getElementById('dark-mode-toggle').checked = moneyManager.settings.darkMode;
    document.getElementById('notifications-toggle').checked = moneyManager.settings.notifications;
    document.getElementById('auto-backup-toggle').checked = moneyManager.settings.autoBackup;
    modal.style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function toggleDarkMode() {
    moneyManager.toggleDarkMode();
}

function toggleNotifications() {
    moneyManager.settings.notifications = !moneyManager.settings.notifications;
    moneyManager.saveData();
    moneyManager.showToast(`Notifications ${moneyManager.settings.notifications ? 'enabled' : 'disabled'}`, 'success');
}

function toggleAutoBackup() {
    moneyManager.settings.autoBackup = !moneyManager.settings.autoBackup;
    moneyManager.saveData();
    moneyManager.showToast(`Auto backup ${moneyManager.settings.autoBackup ? 'enabled' : 'disabled'}`, 'success');
}

// Import functions
function openImportModal() {
    document.getElementById('import-modal').style.display = 'flex';
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
}

function handleFileImport(input) {
    const file = input.files[0];
    if (file) {
        moneyManager.importData(file);
        closeImportModal();
    }
}

// Initialize the app
let moneyManager;
document.addEventListener('DOMContentLoaded', () => {
    moneyManager = new MoneyManager();
});