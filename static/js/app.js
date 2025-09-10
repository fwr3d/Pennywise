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
        this.onboarding = {
            currentStep: 1,
            totalSteps: 4,
            completed: false
        };
        this.currentTransactionId = null;
        this.notificationPermission = false;
        
        this.init();
    }

    async init() {
        this.loadData();
        this.setupEventListeners();
        this.checkOnboarding();
        this.updateDisplay();
        this.loadCharts();
        this.setupDevMode();
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

    // ===== DEVELOPER MODE =====
    setupDevMode() {
        this.devMode = {
            devPanel: null
        };
        
        // Listen for key combinations
        document.addEventListener('keydown', (e) => {
            // Dev mode access with Ctrl+Shift+\
            if (e.ctrlKey && e.shiftKey && e.key === '\\') {
                console.log('Dev mode triggered!');
                this.showDevPanel();
            }
        });
    }

    showDevPanel() {
        // Create dev panel if it doesn't exist
        if (!this.devMode.devPanel) {
            this.createDevPanel();
        }
        
        this.devMode.devPanel.style.display = 'flex';
        this.showToast('Developer Mode - Testing Profiles', 'info');
    }

    createDevPanel() {
        const panel = document.createElement('div');
        panel.id = 'dev-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            font-family: 'Inter', sans-serif;
        `;
        
        panel.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 600px;
                max-height: 500px;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 15px;
                ">
                    <h2 style="color: #1f2937; margin: 0; font-size: 24px;">🧪 Testing Profiles</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" 
                            style="
                                background: #ef4444;
                                color: white;
                                border: none;
                                padding: 8px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 16px;
                            ">✕</button>
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                ">
                    ${this.generateProfileButtons()}
                </div>
                
                            <div style="
                                margin-top: 20px;
                                padding: 15px;
                                background: #f3f4f6;
                                border-radius: 8px;
                                font-size: 14px;
                                color: #6b7280;
                            ">
                                <strong>Instructions:</strong> Click any profile number to load test data for that profile. Each profile contains different financial scenarios for testing purposes.<br><br>
                                <strong>Access:</strong> Press <kbd>Ctrl+Shift+\</kbd> to open this dev panel.
                            </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.devMode.devPanel = panel;
    }

    updateDevStats() {
        if (!this.devMode.devPanel) return;
        
        const stats = document.getElementById('app-stats');
        const performance = document.getElementById('performance-metrics');
        
        if (stats) {
            stats.innerHTML = `
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                    <div>📊 Total Transactions: ${this.transactions.length}</div>
                    <div>💰 Total Income: $${this.transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</div>
                    <div>💸 Total Expenses: $${this.transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</div>
                    <div>🎯 Budgets Set: ${Object.keys(this.budgets).length}</div>
                    <div>🏆 Savings Goals: ${this.savingsGoals.length}</div>
                    <div>🔄 Recurring Transactions: ${this.recurringTransactions.length}</div>
                    <div>💾 Storage Used: ${this.getStorageSize()} KB</div>
                    <div>⏰ Uptime: ${this.getUptime()}</div>
                </div>
            `;
        }
        
        if (performance) {
            performance.innerHTML = `
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                    <div>🚀 Load Time: ${performance.now().toFixed(2)}ms</div>
                    <div>🧠 Memory Usage: ${this.getMemoryUsage()}</div>
                    <div>📱 User Agent: ${navigator.userAgent.substring(0, 50)}...</div>
                    <div>🌐 Language: ${navigator.language}</div>
                    <div>📏 Screen: ${screen.width}x${screen.height}</div>
                    <div>🖥️ Viewport: ${window.innerWidth}x${window.innerHeight}</div>
                </div>
            `;
        }
    }

    // Dev Tools Functions
    devGenerateTestData() {
        const testTransactions = [
            { type: 'Income', amount: 5000, category: 'Salary', description: 'Monthly Salary', timestamp: new Date().toISOString() },
            { type: 'Expense', amount: 1200, category: 'Food', description: 'Groceries', timestamp: new Date().toISOString() },
            { type: 'Expense', amount: 300, category: 'Transportation', description: 'Gas', timestamp: new Date().toISOString() },
            { type: 'Income', amount: 500, category: 'Freelance', description: 'Side Project', timestamp: new Date().toISOString() },
            { type: 'Expense', amount: 200, category: 'Entertainment', description: 'Movie Night', timestamp: new Date().toISOString() }
        ];
        
        this.transactions.push(...testTransactions);
        this.addBudget('Food', 1500, 'monthly');
        this.addBudget('Transportation', 400, 'monthly');
        this.addSavingsGoal('Emergency Fund', 10000, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        this.saveData();
        this.updateDisplay();
        this.loadCharts();
        this.updateDevStats();
        this.showToast('Test data generated! 🎉', 'success');
    }

    devClearAllData() {
        if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
            this.transactions = [];
            this.budgets = {};
            this.savingsGoals = [];
            this.recurringTransactions = [];
            this.salaryConfig = { enabled: false, amount: 0, frequency: 'monthly', pay_day: 1, next_pay_date: null };
            
            this.saveData();
            this.updateDisplay();
            this.loadCharts();
            this.updateDevStats();
            this.showToast('All data cleared! 🗑️', 'warning');
        }
    }

    devExportDebugInfo() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            userAgent: navigator.userAgent,
            screen: { width: screen.width, height: screen.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            data: {
                transactions: this.transactions,
                budgets: this.budgets,
                savingsGoals: this.savingsGoals,
                recurringTransactions: this.recurringTransactions,
                salaryConfig: this.salaryConfig,
                settings: this.settings
            },
            performance: {
                loadTime: performance.now(),
                memoryUsage: this.getMemoryUsage(),
                storageSize: this.getStorageSize()
            }
        };
        
        const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pennywise_debug_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Debug info exported! 📤', 'success');
    }

    devShowConsole() {
        console.log('🚀 PENNYWISE DEVELOPER CONSOLE');
        console.log('================================');
        console.log('Money Manager Instance:', this);
        console.log('Transactions:', this.transactions);
        console.log('Budgets:', this.budgets);
        console.log('Savings Goals:', this.savingsGoals);
        console.log('Settings:', this.settings);
        console.log('================================');
        this.showToast('Check the browser console! 🖥️', 'info');
    }

    // Easter Egg Functions
    devRainbowMode() {
        document.body.style.animation = 'rainbow 2s linear infinite';
        this.showToast('🌈 Rainbow mode activated!', 'success');
        
        // Add rainbow animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.body.style.animation = '';
            this.showToast('Rainbow mode deactivated! 🌈', 'info');
        }, 10000);
    }

    devMoneyRain() {
        const moneySymbols = ['💰', '💵', '💸', '💳', '💎', '🏦', '💼'];
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        for (let i = 0; i < 50; i++) {
            const money = document.createElement('div');
            money.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
            money.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -50px;
                font-size: ${Math.random() * 30 + 20}px;
                animation: moneyFall ${Math.random() * 3 + 2}s linear forwards;
            `;
            container.appendChild(money);
        }
        
        document.body.appendChild(container);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes moneyFall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.body.removeChild(container);
            this.showToast('💰 Money rain complete!', 'success');
        }, 5000);
    }

    devMatrixMode() {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9998;
            pointer-events: none;
        `;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const chars = '01';
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        const interval = setInterval(draw, 50);
        
        setTimeout(() => {
            clearInterval(interval);
            document.body.removeChild(canvas);
            this.showToast('🔢 Matrix mode complete!', 'success');
        }, 10000);
    }

    devKonamiCode() {
        this.showToast('🎮 Konami Code activated! +30 Lives!', 'success');
        
        // Add some fun effects
        document.body.style.transform = 'scale(1.05)';
        setTimeout(() => {
            document.body.style.transform = 'scale(1)';
        }, 200);
        
        // Add some extra money
        this.transactions.push({
            type: 'Income',
            amount: 1000,
            category: 'Gift',
            description: 'Konami Code Bonus! 🎮',
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
        this.updateDisplay();
        this.showToast('+$1000 Konami Bonus added! 💰', 'success');
    }

    // Helper functions
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return (total / 1024).toFixed(2);
    }

    getUptime() {
        const startTime = performance.timing.navigationStart;
        const currentTime = Date.now();
        const uptime = currentTime - startTime;
        return Math.floor(uptime / 1000) + 's';
    }

    getMemoryUsage() {
        if (performance.memory) {
            return (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB';
        }
        return 'N/A';
    }

    // ===== ONBOARDING =====
    checkOnboarding() {
        // Check if onboarding is already completed in memory
        if (this.onboarding.completed) {
            console.log('Onboarding already completed in memory, skipping check');
            return;
        }
        
        const onboardingCompleted = localStorage.getItem('pennywise_onboarding_completed');
        console.log('Onboarding check:', onboardingCompleted);
        if (!onboardingCompleted || onboardingCompleted !== 'true') {
            console.log('Showing onboarding modal...');
            this.showOnboardingModal();
        } else {
            console.log('Onboarding already completed, skipping');
            this.onboarding.completed = true;
        }
    }

    showOnboardingModal() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.onboarding.currentStep = 1;
            this.updateOnboardingProgress();
        }
    }

    updateOnboardingProgress() {
        const progressFill = document.getElementById('onboarding-progress');
        const stepText = document.getElementById('onboarding-step');
        if (progressFill && stepText) {
            const progress = (this.onboarding.currentStep / this.onboarding.totalSteps) * 100;
            progressFill.style.width = `${progress}%`;
            stepText.textContent = `Step ${this.onboarding.currentStep} of ${this.onboarding.totalSteps}`;
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.onboarding.currentStep < this.onboarding.totalSteps) {
                this.onboarding.currentStep++;
                this.showStep(this.onboarding.currentStep);
                this.updateOnboardingProgress();
                this.updateNavigationButtons();
            }
        }
    }

    previousStep() {
        if (this.onboarding.currentStep > 1) {
            this.onboarding.currentStep--;
            this.showStep(this.onboarding.currentStep);
            this.updateOnboardingProgress();
            this.updateNavigationButtons();
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStep = document.getElementById(`step-${stepNumber}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const finishBtn = document.getElementById('finish-setup');

        if (prevBtn) {
            prevBtn.style.display = this.onboarding.currentStep > 1 ? 'inline-block' : 'none';
        }
        
        if (nextBtn && finishBtn) {
            if (this.onboarding.currentStep === this.onboarding.totalSteps) {
                nextBtn.style.display = 'none';
                finishBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                finishBtn.style.display = 'none';
            }
        }
    }

    validateCurrentStep() {
        const currentStep = document.getElementById(`step-${this.onboarding.currentStep}`);
        if (!currentStep) return false;

        const requiredFields = currentStep.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                this.showToast('Please fill in all required fields', 'warning');
                return false;
            }
        }
        
        // For step 4 (goals), check if any goal is partially filled
        if (this.onboarding.currentStep === 4) {
            const goalItems = currentStep.querySelectorAll('.goal-item');
            for (let goalItem of goalItems) {
                const name = goalItem.querySelector('.goal-name').value.trim();
                const amount = goalItem.querySelector('.goal-amount').value.trim();
                const date = goalItem.querySelector('.goal-date').value.trim();
                
                // If any field is filled, all fields must be filled
                if (name || amount || date) {
                    if (!name || !amount || !date) {
                        this.showToast('Please complete all fields for each goal or leave them empty', 'warning');
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    finishOnboarding() {
        console.log('finishOnboarding called, current step:', this.onboarding.currentStep);
        if (this.validateCurrentStep()) {
            console.log('Validation passed, saving data...');
            this.saveOnboardingData();
            this.onboarding.completed = true;
            localStorage.setItem('pennywise_onboarding_completed', 'true');
            console.log('Onboarding completed, flag set to:', localStorage.getItem('pennywise_onboarding_completed'));
            
            // Close modal and show success message
            this.closeOnboardingModal();
            this.showToast('Welcome to Pennywise! Your profile has been set up.', 'success');
            this.updateDisplay();
            
            // Prevent any further onboarding checks
            this.onboarding.completed = true;
            console.log('Onboarding flow completed successfully');
            
            // Force a small delay to ensure modal closes
            setTimeout(() => {
                console.log('Onboarding completion confirmed');
            }, 100);
        } else {
            console.log('Validation failed for step:', this.onboarding.currentStep);
        }
    }

    saveOnboardingData() {
        // Save job information
        const jobTitle = document.getElementById('job-title').value;
        const company = document.getElementById('company').value;
        const salaryFrequency = document.getElementById('salary-frequency').value;
        const salaryAmount = parseFloat(document.getElementById('salary-amount').value);

        // Update salary config
        this.salaryConfig = {
            enabled: true,
            amount: salaryAmount,
            frequency: salaryFrequency,
            pay_day: 1,
            next_pay_date: this.calculateNextPayDate(salaryFrequency)
        };

        // Create initial salary income transaction
        if (salaryAmount > 0) {
            const salaryTransaction = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                type: 'Income',
                category: 'Salary',
                description: `Salary from ${company}`,
                amount: salaryAmount,
                date: new Date().toISOString().split('T')[0]
            };
            this.transactions.push(salaryTransaction);
            console.log('Created salary income transaction:', salaryTransaction);
        }

        // Add a few sample transactions to populate the dashboard
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        const sampleTransactions = [
            {
                id: Date.now() + 1,
                timestamp: yesterday.toISOString(),
                type: 'Expense',
                category: 'Food',
                description: 'Grocery shopping',
                amount: -85.50,
                date: yesterday.toISOString().split('T')[0]
            },
            {
                id: Date.now() + 2,
                timestamp: twoDaysAgo.toISOString(),
                type: 'Expense',
                category: 'Transportation',
                description: 'Gas for car',
                amount: -45.00,
                date: twoDaysAgo.toISOString().split('T')[0]
            }
        ];

        // Only add sample transactions if there are no existing transactions
        if (this.transactions.length <= 1) { // Only salary transaction
            this.transactions.push(...sampleTransactions);
            console.log('Added sample transactions for dashboard demo');
        }

        // Save expenses as recurring transactions
        const expenseItems = document.querySelectorAll('.expense-item');
        expenseItems.forEach(item => {
            const category = item.querySelector('.expense-category').value;
            const amount = parseFloat(item.querySelector('.expense-amount').value);
            
            if (category && amount > 0) {
                this.addRecurringTransaction({
                    description: `${category} Expense`,
                    amount: -amount,
                    category: category,
                    frequency: 'monthly',
                    next_date: this.getNextMonthDate()
                });
            }
        });

        // Save subscriptions as recurring transactions
        const subscriptionItems = document.querySelectorAll('.subscription-item');
        subscriptionItems.forEach(item => {
            const name = item.querySelector('.subscription-name').value;
            const amount = parseFloat(item.querySelector('.subscription-amount').value);
            const cycle = item.querySelector('.subscription-cycle').value;
            
            if (name && amount > 0) {
                this.addRecurringTransaction({
                    description: name,
                    amount: -amount,
                    category: 'Subscriptions',
                    frequency: cycle,
                    next_date: this.getNextDateForCycle(cycle)
                });
            }
        });

        // Save financial goals (only if they have all fields filled)
        const goalItems = document.querySelectorAll('.goal-item');
        goalItems.forEach(item => {
            const name = item.querySelector('.goal-name').value.trim();
            const amount = parseFloat(item.querySelector('.goal-amount').value);
            const date = item.querySelector('.goal-date').value;
            
            if (name && amount > 0 && date) {
                this.addSavingsGoal({
                    name: name,
                    targetAmount: amount,
                    targetDate: date,
                    currentAmount: 0
                });
            }
        });

        // Save all data
        this.saveData();
    }

    calculateNextPayDate(frequency) {
        const today = new Date();
        const nextDate = new Date(today);
        
        switch (frequency) {
            case 'weekly':
                nextDate.setDate(today.getDate() + 7);
                break;
            case 'bi-weekly':
                nextDate.setDate(today.getDate() + 14);
                break;
            case 'semi-monthly':
                nextDate.setDate(15);
                if (nextDate <= today) {
                    nextDate.setMonth(today.getMonth() + 1);
                }
                break;
            case 'monthly':
                nextDate.setMonth(today.getMonth() + 1);
                break;
            case 'annually':
                nextDate.setFullYear(today.getFullYear() + 1);
                break;
        }
        
        return nextDate.toISOString().split('T')[0];
    }

    getNextMonthDate() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        return nextMonth.toISOString().split('T')[0];
    }

    getNextDateForCycle(cycle) {
        const today = new Date();
        const nextDate = new Date(today);
        
        switch (cycle) {
            case 'weekly':
                nextDate.setDate(today.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(today.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(today.getFullYear() + 1);
                break;
        }
        
        return nextDate.toISOString().split('T')[0];
    }

    closeOnboardingModal() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            console.log('Closing onboarding modal...');
            modal.style.display = 'none';
            console.log('Modal closed, display style:', modal.style.display);
        } else {
            console.log('Onboarding modal not found!');
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

// Global functions for onboarding
function nextStep() {
    moneyManager.nextStep();
}

function previousStep() {
    moneyManager.previousStep();
}

function finishOnboarding() {
    moneyManager.finishOnboarding();
}

function addExpense() {
    const expensesList = document.getElementById('expenses-list');
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.innerHTML = `
        <div class="form-group">
            <label>Expense Category</label>
            <select class="expense-category" required>
                <option value="">Select category</option>
                <option value="Housing">Housing (Rent/Mortgage)</option>
                <option value="Utilities">Utilities</option>
                <option value="Food">Food & Groceries</option>
                <option value="Transportation">Transportation</option>
                <option value="Insurance">Insurance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label>Amount (per month)</label>
            <input type="number" class="expense-amount" placeholder="e.g., 1200" min="0" step="0.01" required>
        </div>
        <button type="button" class="btn-remove-expense" onclick="removeExpense(this)">×</button>
    `;
    expensesList.appendChild(expenseItem);
}

function removeExpense(button) {
    button.parentElement.remove();
}

function addSubscription() {
    const subscriptionsList = document.getElementById('subscriptions-list');
    const subscriptionItem = document.createElement('div');
    subscriptionItem.className = 'subscription-item';
    subscriptionItem.innerHTML = `
        <div class="form-group">
            <label>Service Name</label>
            <input type="text" class="subscription-name" placeholder="e.g., Netflix, Spotify, Gym Membership" required>
        </div>
        <div class="form-group">
            <label>Amount (per month)</label>
            <input type="number" class="subscription-amount" placeholder="e.g., 15.99" min="0" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Billing Cycle</label>
            <select class="subscription-cycle" required>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
            </select>
        </div>
        <button type="button" class="btn-remove-subscription" onclick="removeSubscription(this)">×</button>
    `;
    subscriptionsList.appendChild(subscriptionItem);
}

function removeSubscription(button) {
    button.parentElement.remove();
}

function addGoal() {
    const goalsList = document.getElementById('goals-list');
    const goalItem = document.createElement('div');
    goalItem.className = 'goal-item';
    goalItem.innerHTML = `
        <div class="form-group">
            <label>Goal Name</label>
            <input type="text" class="goal-name" placeholder="e.g., Emergency Fund, Vacation, New Car" required>
        </div>
        <div class="form-group">
            <label>Target Amount</label>
            <input type="number" class="goal-amount" placeholder="e.g., 10000" min="0" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Target Date</label>
            <input type="date" class="goal-date" required>
        </div>
        <button type="button" class="btn-remove-goal" onclick="removeGoal(this)">×</button>
    `;
    goalsList.appendChild(goalItem);
}

function removeGoal(button) {
    button.parentElement.remove();
}

function resetOnboarding() {
    localStorage.removeItem('pennywise_onboarding_completed');
    location.reload();
}
// Initialize the app
let moneyManager;
document.addEventListener('DOMContentLoaded', () => {
    moneyManager = new MoneyManager();
});