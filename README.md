# 💰 Pennywise - Money Manager

A beautiful, modern money management web application built with pure HTML, CSS, and JavaScript. Perfect for tracking income, expenses, and managing your personal finances.

![Pennywise Money Manager](https://img.shields.io/badge/Status-Live-brightgreen)
![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 💳 **Transaction Management** - Add, edit, and delete income/expense transactions
- 📊 **Real-time Analytics** - Interactive charts showing spending patterns
- 💰 **Financial Overview** - Live balance tracking and monthly summaries
- 💼 **Salary Management** - Configure recurring income with smart calculations
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 💾 **Data Persistence** - All data saved locally in your browser
- 📈 **Data Export** - Export transactions to CSV format
- 🎨 **Modern UI** - Beautiful glassmorphism design with smooth animations

## 🚀 Live Demo

Visit the live application: **[https://yourusername.github.io/Pennywise](https://yourusername.github.io/Pennywise)**

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Plotly.js for interactive visualizations
- **Icons**: Font Awesome
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages

## 📦 Installation & Setup

### Option 1: Use the Live Version
Simply visit the GitHub Pages URL above - no installation required!

### Option 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/Pennywise.git
   cd Pennywise
   ```

2. Open `index.html` in your web browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Visit `http://localhost:8000` in your browser

## 🚀 Deploy to GitHub Pages

1. **Fork this repository** to your GitHub account

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

3. **Update the repository URL** in this README:
   - Replace `yourusername` with your GitHub username
   - Update the live demo link

4. **Your app will be live** at: `https://yourusername.github.io/Pennywise`

## 📱 How to Use

### Adding Transactions
1. Click the "Add Transaction" button
2. Select Income or Expense
3. Choose a category
4. Enter amount and description
5. Set the date
6. Click "Save Transaction"

### Managing Salary
1. When adding Income, select "Salary" as category
2. Check "Enable Salary Management"
3. Configure amount, frequency, and pay day
4. Save for future quick additions

### Viewing Analytics
- **Expense Breakdown**: See where your money goes with interactive pie charts
- **Monthly Trends**: Track income vs expenses over time
- **Financial Summary**: Monitor your balance and monthly totals

### Exporting Data
- Click "Export" to download all transactions as CSV
- Perfect for backup or importing into other tools

## 🎨 Customization

### Colors
Edit `static/css/style.css` and modify the CSS variables:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --danger-color: #f56565;
    /* ... more colors */
}
```

### Categories
Modify the categories in `static/js/app.js`:
```javascript
this.categories = {
    'Income': ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    'Expense': ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Other']
};
```

## 🔒 Data Privacy

- All data is stored locally in your browser's localStorage
- No data is sent to external servers
- Your financial information stays private and secure
- Data persists between browser sessions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Plotly.js](https://plotly.com/javascript/) for beautiful interactive charts
- [Font Awesome](https://fontawesome.com/) for amazing icons
- [Inter Font](https://rsms.me/inter/) for clean typography

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the existing issues for solutions
- Contact the maintainer

---

**Made with ❤️ for better financial management**