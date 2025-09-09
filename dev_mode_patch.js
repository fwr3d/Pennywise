    // ===== DEVELOPER MODE =====
    setupDevMode() {
        this.devMode = {
            devPanel: null
        };
        
        // Listen for key combinations
        document.addEventListener('keydown', (e) => {
            // Quick dev mode access with Ctrl+Shift+Q
            if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
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
                    <strong>Instructions:</strong> Click any profile number to load test data for that profile. Each profile contains different financial scenarios for testing purposes.
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.devMode.devPanel = panel;
    }

    generateProfileButtons() {
        const profiles = [
            { id: 1, name: 'Student', desc: 'Low income, high expenses' },
            { id: 2, name: 'Professional', desc: 'Steady salary, moderate spending' },
            { id: 3, name: 'Entrepreneur', desc: 'Variable income, business expenses' },
            { id: 4, name: 'Retiree', desc: 'Fixed income, careful budgeting' },
            { id: 5, name: 'Freelancer', desc: 'Irregular income, project-based' },
            { id: 6, name: 'High Earner', desc: 'High income, luxury spending' },
            { id: 7, name: 'Saver', desc: 'Moderate income, high savings rate' },
            { id: 8, name: 'Spender', desc: 'Good income, high expenses' },
            { id: 9, name: 'Minimalist', desc: 'Low income, minimal expenses' }
        ];

        return profiles.map(profile => `
            <button onclick="moneyManager.loadTestProfile(${profile.id})" 
                    style="
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        border: none;
                        padding: 20px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        text-align: center;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    " 
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 15px rgba(0, 0, 0, 0.2)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'">
                <div style="font-size: 24px; margin-bottom: 8px;">${profile.id}</div>
                <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${profile.name}</div>
                <div style="font-size: 12px; opacity: 0.9;">${profile.desc}</div>
            </button>
        `).join('');
    }

    loadTestProfile(profileId) {
        // Clear existing data
        this.transactions = [];
        this.budgets = {};
        this.savingsGoals = [];
        this.recurringTransactions = [];
        this.salaryConfig = { enabled: false, amount: 0, frequency: 'monthly', pay_day: 1, next_pay_date: null };

        // Load profile-specific data
        const profiles = {
            1: { // Student
                transactions: [
                    { type: 'Income', amount: 1200, category: 'Salary', description: 'Part-time Job', timestamp: new Date().toISOString() },
                    { type: 'Income', amount: 500, category: 'Gift', description: 'Parents Support', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Food', description: 'Groceries & Dining', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 400, category: 'Education', description: 'Books & Supplies', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 300, category: 'Transportation', description: 'Bus Pass & Gas', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 200, category: 'Entertainment', description: 'Movies & Games', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Food': { amount: 1000, period: 'monthly', spent: 800, created: new Date().toISOString() } },
                goals: [{ name: 'Emergency Fund', targetAmount: 2000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            2: { // Professional
                transactions: [
                    { type: 'Income', amount: 6000, category: 'Salary', description: 'Monthly Salary', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 2000, category: 'Bills', description: 'Rent & Utilities', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Food', description: 'Groceries', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 500, category: 'Transportation', description: 'Car Payment & Gas', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 300, category: 'Entertainment', description: 'Dining Out', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 200, category: 'Healthcare', description: 'Insurance', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Food': { amount: 1000, period: 'monthly', spent: 800, created: new Date().toISOString() }, 'Transportation': { amount: 600, period: 'monthly', spent: 500, created: new Date().toISOString() } },
                goals: [{ name: 'House Down Payment', targetAmount: 50000, targetDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            3: { // Entrepreneur
                transactions: [
                    { type: 'Income', amount: 8000, category: 'Freelance', description: 'Client Project A', timestamp: new Date().toISOString() },
                    { type: 'Income', amount: 3000, category: 'Freelance', description: 'Client Project B', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1500, category: 'Bills', description: 'Office Rent', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Food', description: 'Business Meals', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 500, category: 'Education', description: 'Software Subscriptions', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 300, category: 'Transportation', description: 'Business Travel', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Bills': { amount: 2000, period: 'monthly', spent: 1500, created: new Date().toISOString() } },
                goals: [{ name: 'Business Expansion', targetAmount: 25000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            4: { // Retiree
                transactions: [
                    { type: 'Income', amount: 3000, category: 'Investment', description: 'Pension', timestamp: new Date().toISOString() },
                    { type: 'Income', amount: 1000, category: 'Investment', description: 'Social Security', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1200, category: 'Bills', description: 'Mortgage & Utilities', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 600, category: 'Food', description: 'Groceries', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 400, category: 'Healthcare', description: 'Medical Expenses', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 200, category: 'Entertainment', description: 'Hobbies', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Healthcare': { amount: 500, period: 'monthly', spent: 400, created: new Date().toISOString() } },
                goals: [{ name: 'Travel Fund', targetAmount: 10000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            5: { // Freelancer
                transactions: [
                    { type: 'Income', amount: 2500, category: 'Freelance', description: 'Web Design Project', timestamp: new Date().toISOString() },
                    { type: 'Income', amount: 1800, category: 'Freelance', description: 'Writing Assignment', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Bills', description: 'Home Office', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 500, category: 'Food', description: 'Groceries', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 300, category: 'Education', description: 'Online Courses', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 200, category: 'Transportation', description: 'Client Meetings', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Bills': { amount: 1000, period: 'monthly', spent: 800, created: new Date().toISOString() } },
                goals: [{ name: 'Tax Fund', targetAmount: 8000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            6: { // High Earner
                transactions: [
                    { type: 'Income', amount: 15000, category: 'Salary', description: 'Executive Salary', timestamp: new Date().toISOString() },
                    { type: 'Income', amount: 3000, category: 'Investment', description: 'Stock Dividends', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 5000, category: 'Bills', description: 'Luxury Home', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 2000, category: 'Food', description: 'Fine Dining', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1500, category: 'Transportation', description: 'Luxury Car', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1000, category: 'Entertainment', description: 'Travel & Leisure', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Food': { amount: 2500, period: 'monthly', spent: 2000, created: new Date().toISOString() } },
                goals: [{ name: 'Investment Portfolio', targetAmount: 100000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            7: { // Saver
                transactions: [
                    { type: 'Income', amount: 5000, category: 'Salary', description: 'Monthly Salary', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1200, category: 'Bills', description: 'Rent & Utilities', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 400, category: 'Food', description: 'Groceries', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 200, category: 'Transportation', description: 'Public Transit', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 100, category: 'Entertainment', description: 'Minimal Entertainment', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Food': { amount: 500, period: 'monthly', spent: 400, created: new Date().toISOString() } },
                goals: [{ name: 'Early Retirement', targetAmount: 500000, targetDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            8: { // Spender
                transactions: [
                    { type: 'Income', amount: 7000, category: 'Salary', description: 'Monthly Salary', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 2500, category: 'Bills', description: 'Rent & Utilities', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1500, category: 'Food', description: 'Dining Out', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 1000, category: 'Shopping', description: 'Clothes & Gadgets', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Entertainment', description: 'Concerts & Events', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 500, category: 'Transportation', description: 'Uber & Taxis', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Shopping': { amount: 1200, period: 'monthly', spent: 1000, created: new Date().toISOString() } },
                goals: [{ name: 'Debt Payoff', targetAmount: 15000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            },
            9: { // Minimalist
                transactions: [
                    { type: 'Income', amount: 2000, category: 'Salary', description: 'Part-time Work', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 800, category: 'Bills', description: 'Minimal Rent', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 300, category: 'Food', description: 'Basic Groceries', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 100, category: 'Transportation', description: 'Bicycle Maintenance', timestamp: new Date().toISOString() },
                    { type: 'Expense', amount: 50, category: 'Entertainment', description: 'Library Books', timestamp: new Date().toISOString() }
                ],
                budgets: { 'Food': { amount: 400, period: 'monthly', spent: 300, created: new Date().toISOString() } },
                goals: [{ name: 'Freedom Fund', targetAmount: 5000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currentAmount: 0, created: new Date().toISOString() }]
            }
        };

        const profile = profiles[profileId];
        if (profile) {
            this.transactions = profile.transactions;
            this.budgets = profile.budgets;
            this.savingsGoals = profile.goals;
            
            this.saveData();
            this.updateDisplay();
            this.loadCharts();
            
            this.devMode.devPanel.style.display = 'none';
            this.showToast(`Profile ${profileId} loaded successfully! 🎯`, 'success');
        }
    }
