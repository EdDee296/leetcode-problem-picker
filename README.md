# 🎯 Lee## ✨ Features

- 📊 **Professional Excel Support** - Upload .xlsx/.xls files with SheetJS library
- 🏢 **Company Organization** - Each Excel sheet represents a different company
- 🎲 **Smart Problem Selection** - Pick random problems from specific companies
- ✅ **Progress Tracking** - Automatically tracks solved problems
- 🔧 **Advanced Solved Management** - Dedicated window for granular problem control
- 💾 **Data Persistence** - Remembers your preferences and progress
- 🚫 **Skip Solved Problems** - Option to avoid already completed problems
- 📱 **Modern UI** - Beautiful gradient design with intuitive controls
- 🔍 **Advanced Debugging** - Detailed file analysis toolslem Picker Chrome Extension

A powerful Chrome extension that helps you practice LeetCode problems efficiently by organizing them by company and opening random selections for focused study sessions.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)
![Excel Support](https://img.shields.io/badge/Excel-Supported-blue)
![SheetJS](https://img.shields.io/badge/SheetJS-Powered-orange)

## ✨ Features

- 📊 **Professional Excel Support** - Upload .xlsx/.xls files with SheetJS library
- 🏢 **Company Organization** - Each Excel sheet represents a different company
- � **Smart Problem Selection** - Pick random problems from specific companies
- � **Progress Tracking** - Automatically tracks solved problems
- 💾 **Data Persistence** - Remembers your preferences and progress
- � **Skip Solved Problems** - Option to avoid already completed problems
- 📱 **Modern UI** - Beautiful gradient design with intuitive controls
- 🔍 **Advanced Debugging** - Detailed file analysis tools

## 🚀 Quick Start

### Step 1: Install the Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Select the `leetcode picker` folder
6. Pin the extension to your toolbar (optional but recommended)

### Step 2: Prepare Your Excel File

Create an Excel file (.xlsx or .xls) with this structure:

- **Each sheet = One company** (e.g., "Google", "Amazon", "Microsoft")
- **All URLs in Column A** of each sheet (A1, A2, A3, etc.)
- **URLs sorted by frequency** (most frequent problems first)
- **No headers needed** - just URLs starting from A1

#### Example Excel Structure:

```
📁 MyLeetCodeProblems.xlsx
   📄 Google (sheet)
      A1: https://leetcode.com/problems/two-sum/
      A2: https://leetcode.com/problems/reverse-integer/
      A3: https://leetcode.com/problems/integer-to-roman/
      A4: ...
   📄 Amazon (sheet)
      A1: https://leetcode.com/problems/add-two-numbers/
      A2: https://leetcode.com/problems/palindrome-number/
      A3: https://leetcode.com/problems/roman-to-integer/
      A4: ...
   📄 Microsoft (sheet)
      A1: https://leetcode.com/problems/longest-substring/
      A2: https://leetcode.com/problems/zigzag-conversion/
      A3: ...
```

### Step 3: Use the Extension

1. Click the extension icon in your Chrome toolbar
2. Upload your Excel file (click **"Choose Excel File"**)
3. Select a company from the dropdown
4. Choose number of problems (1-50)
5. Toggle **"Skip solved problems"** if desired
6. Click **"Open Random Problems"**
7. **Manage solved problems** using the dedicated management window

## 🎯 Solved Problems Management

### Overview
The extension features a **separate management window** for handling solved problems with granular control:

### Accessing the Manager
- After selecting a company, if you have solved problems, you'll see: `X solved problems [Manage Solved]`
- Click **"Manage Solved"** to open the dedicated management window

### Management Features

#### 📊 **Visual Status Indicators**
- **🔴 Red items**: "Will Skip" - These problems are excluded from future problem selections
- **🟢 Green items**: "Can Retry" - These problems will be included in future selections

#### 🔧 **Granular Control**
- **Individual Selection**: Check/uncheck specific problems to change their status
- **Clear Status Indicators**: Instantly see which problems will be skipped vs. included
- **Company Statistics**: View solved counts and retry availability per company

#### ⚡ **Bulk Operations**
- **Mark Selected as Unsolved**: Remove multiple problems from solved status
- **Real-time Updates**: Changes are immediately saved and synchronized
- **Status Feedback**: Clear success messages confirm your actions

#### 🎨 **Professional Interface**
- **Dedicated 900x700 Window**: Spacious interface that doesn't clutter the main extension
- **Company Organization**: Problems grouped by company for easy navigation
- **Modern Design**: Consistent gradient theme with intuitive controls

### Workflow Example

1. **Practice Problems**: Use main extension to open and solve problems
2. **Review Progress**: Check solved count in main interface
3. **Manage Status**: Click "Manage Solved" to open management window
4. **Fine-tune Selection**: 
   - See red problems that will be skipped
   - See green problems you can retry
   - Uncheck specific problems you want to practice again
5. **Apply Changes**: Close window - changes are automatically saved
6. **Next Session**: Future problem picks respect your preferences

## 📋 Requirements

- **File Format**: Excel files (.xlsx or .xls)
- **URL Format**: Valid LeetCode URLs: `https://leetcode.com/problems/problem-name/`
- **Structure**: Company names as sheet names, URLs in column A
- **Browser**: Google Chrome with Developer mode enabled

## 🛠️ Technical Details

- **Excel Parser**: SheetJS (xlsx.min.js) for professional Excel file handling
- **Storage**: Chrome Storage API for data persistence
- **Architecture**: Manifest V3 Chrome Extension
- **UI Framework**: Custom CSS with modern gradient design

## 🔧 Advanced Features

### Progress Tracking

- Automatically marks opened problems as "solved"
- Track completion progress per company
- **Advanced solved management** with dedicated interface
- **Visual status indicators** for skip vs. retry problems
- **Granular control** over individual problem status

### Smart Selection

- Avoids already solved problems (optional)
- Respects your frequency-based problem ordering
- Supports 1-50 problems per session
- **Intelligent filtering** based on solved problem preferences

### Data Management

- **Update Spreadsheet**: Upload new versions of your Excel file
- **Manage Solved Problems**: Dedicated window for fine-tuned control
- **Bulk Operations**: Mark multiple problems as unsolved
- **Clear All Data**: Remove all stored data and start fresh

### Debugging Tools

- **Debug File Info**: Analyze uploaded Excel files
- **Console Logging**: Detailed parsing information
- **Error Handling**: Clear error messages and solutions

## 🐛 Troubleshooting

### "No LeetCode URLs found"

- Ensure URLs are in **column A** of each sheet
- Check URL format: `https://leetcode.com/problems/problem-name/`
- Verify sheet names are company names

### "Failed to parse Excel file"

- Try re-saving your Excel file
- Ensure file is not corrupted
- Use the **Debug** button to analyze the file

### Extension not loading

- Check that **Developer mode** is enabled
- Refresh the extension at `chrome://extensions/`
- Ensure all files are in the correct folder

## 🔒 Privacy & Security

- **Local Storage Only**: All data stored locally in your browser
- **No External Servers**: No data sent to external services
- **Your Data Stays Private**: Spreadsheet content never leaves your device

## 📦 Project Structure

```
leetcode-picker/
├── manifest.json          # Extension configuration
├── popup.html             # Main extension UI
├── popup.js              # Main application logic
├── solved-manager.html   # Solved problems management UI
├── solved-manager.js     # Solved problems management logic
├── excel-parser.js       # SheetJS-powered Excel parser
├── xlsx.min.js          # SheetJS library
└── README.md            # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 Version History

- **v1.1**: Advanced solved problems management with dedicated interface, visual status indicators, and granular control
- **v1.0**: Professional Excel support with SheetJS, progress tracking, modern UI

## 🎉 Getting Started

Ready to boost your LeetCode practice?

1. **Download or clone this repository**
2. **Follow the installation steps above**
3. **Create your Excel file with company-organized problems**
4. **Start practicing efficiently!**

---

**Happy coding!** 🚀 Made with ❤️ for efficient LeetCode practice
