// LeetCode Problem Picker - Enhanced version with memory and tracking

let spreadsheetData = {};
let solvedProblems = new Set();
let userPreferences = {
    selectedCompany: '',
    questionCount: 5,
    excludeSolved: true
};

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const updateBtn = document.getElementById('updateBtn');
    const fileStatus = document.getElementById('fileStatus');
    const companySelect = document.getElementById('companySelect');
    const questionCount = document.getElementById('questionCount');
    const excludeSolved = document.getElementById('excludeSolved');
    const openProblemsBtn = document.getElementById('openProblemsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const resetSolvedBtn = document.getElementById('resetSolvedBtn');
    const debugBtn = document.getElementById('debugBtn');
    const status = document.getElementById('status');
    const statsSection = document.getElementById('statsSection');

    // Load saved data on startup
    loadSavedData();

    // Event listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    updateBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    companySelect.addEventListener('change', onCompanyChange);
    questionCount.addEventListener('input', onQuestionCountChange);
    excludeSolved.addEventListener('change', onExcludeSolvedChange);
    openProblemsBtn.addEventListener('click', openRandomProblems);
    clearDataBtn.addEventListener('click', clearAllData);
    resetSolvedBtn.addEventListener('click', resetSolvedProblems);
    debugBtn.addEventListener('click', debugFileInfo);

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('File upload started:', file.name, file.size, 'bytes', file.type);
        showStatus('Processing Excel file...', 'info');
        updateFileStatus('Processing...', false);
        
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            console.log('File extension:', fileExtension);
            
            if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
                throw new Error('Please upload an Excel file (.xlsx or .xls). Selected file has extension: .' + fileExtension);
            }
            
            if (file.size === 0) {
                throw new Error('The uploaded file is empty (0 bytes)');
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                throw new Error('File is too large. Please upload a file smaller than 50MB.');
            }
            
            console.log('Starting Excel parsing...');
            const data = await parseExcel(file);
            
            if (!data || Object.keys(data).length === 0) {
                throw new Error('No data found in Excel file. Please ensure it contains LeetCode URLs.');
            }
            
            console.log('Excel parsed successfully, saving data...');
            spreadsheetData = data;
            await saveAllData();
            populateCompanySelect();
            updateFileStatus(file.name, true);
            
            const companyCount = Object.keys(data).length;
            const totalUrls = Object.values(data).reduce((sum, urls) => sum + urls.length, 0);
            showStatus(`✅ Excel file loaded! Found ${companyCount} companies with ${totalUrls} problems total.`, 'success');
            
        } catch (error) {
            console.error('File upload error:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            showStatus(`❌ ${errorMessage}`, 'error');
            updateFileStatus('Error loading file', false);
            
            // Clear the file input so user can try again
            fileInput.value = '';
        }
    }

    async function parseCSV(file) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row.');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = {};
        
        // Initialize companies
        headers.forEach(company => {
            if (company) {
                data[company] = [];
            }
        });
        
        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            values.forEach((value, index) => {
                if (value && headers[index] && isValidLeetCodeURL(value)) {
                    data[headers[index]].push(value);
                }
            });
        }
        
        return data;
    }

    async function parseExcel(file) {
        console.log('Starting Excel parsing for:', file.name, 'Size:', file.size, 'bytes');
        
        try {
            // Method 1: Try the SimpleExcelParser if available
            if (window.SimpleExcelParser) {
                console.log('Using SimpleExcelParser...');
                const data = await window.SimpleExcelParser.parseExcelFile(file);
                console.log('SimpleExcelParser successful, found companies:', Object.keys(data));
                
                if (Object.keys(data).length > 0) {
                    return data;
                }
            }
            
            console.log('SimpleExcelParser failed or no data, trying fallback...');
            
            // Method 2: Fallback - Simple binary text extraction
            const arrayBuffer = await file.arrayBuffer();
            const data = await parseExcelSimple(arrayBuffer, file.name);
            
            if (Object.keys(data).length === 0) {
                throw new Error('No LeetCode URLs found in the Excel file');
            }
            
            return data;
            
        } catch (error) {
            console.error('All Excel parsing methods failed:', error);
            throw new Error(`Cannot read Excel file "${file.name}": ${error.message}. Try these solutions:
1. Make sure the file is a valid Excel file (.xlsx or .xls)
2. Ensure each sheet contains LeetCode URLs (https://leetcode.com/problems/...)
3. Check that sheet names are company names (Google, Amazon, etc.)
4. Try re-saving the Excel file if it's corrupted`);
        }
    }

    async function parseExcelSimple(arrayBuffer, fileName) {
        console.log('Using simple Excel parser fallback...');
        
        try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const data = {};
            
            // Convert binary data to text (works for many Excel files)
            let content = '';
            const decoder = new TextDecoder('utf-8', { fatal: false });
            
            // Process file in larger chunks for better text extraction
            const chunkSize = 1000;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.slice(i, i + chunkSize);
                const text = decoder.decode(chunk, { stream: true });
                content += text;
            }
            
            console.log('Extracted text content length:', content.length);
            
            // Find all LeetCode URLs in column A pattern
            // Look for URLs that appear to be in column A (sequential pattern)
            const urlPattern = /https?:\/\/(www\.)?leetcode\.com\/problems\/[\w-]+\/?/gi;
            const allUrls = [...new Set(content.match(urlPattern) || [])];
            
            console.log('Found LeetCode URLs:', allUrls.length);
            
            if (allUrls.length === 0) {
                throw new Error('No LeetCode URLs found in the Excel file. Make sure URLs are in column A of each sheet.');
            }
            
            // Try to find company/sheet names more specifically
            const companyPatterns = [
                // Look for common company names in the content
                /\b(Google|Amazon|Microsoft|Meta|Apple|Netflix|Uber|Lyft|Facebook|Twitter|X|LinkedIn|Spotify|Airbnb|Dropbox|Slack|Zoom|Tesla|Adobe|Salesforce|Oracle|IBM|Intel|Nvidia|PayPal|Square|Stripe|Coinbase|Robinhood|Pinterest|Snapchat|TikTok|ByteDance|Palantir|Twilio|Datadog|Snowflake|Atlassian|ServiceNow|Workday|CrowdStrike|MongoDB|Elastic|Redis|Docker|GitHub|GitLab|Figma|Notion|Asana|Jira|Confluence)\b/gi,
                // Look for Excel sheet name patterns
                /<sheet[^>]*name=["\']([^"\']+)["\'][^>]*>/gi,
                /name=["\']([A-Za-z][A-Za-z0-9\s]*)["\'].*sheet/gi
            ];
            
            const foundCompanies = new Set();
            
            companyPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const company = match[1].trim();
                    if (company && 
                        company.length > 2 && 
                        company.length < 20 && 
                        !company.toLowerCase().includes('sheet') &&
                        !company.toLowerCase().includes('workbook') &&
                        /^[A-Za-z]/.test(company)) {
                        foundCompanies.add(company);
                    }
                }
            });
            
            let companies = Array.from(foundCompanies);
            console.log('Found potential companies:', companies);
            
            // If we found companies, try to distribute URLs based on their position in the file
            if (companies.length > 1 && allUrls.length > companies.length) {
                // Assume URLs are grouped by company in the order they appear
                const urlsPerCompany = Math.ceil(allUrls.length / companies.length);
                companies.forEach((company, index) => {
                    const start = index * urlsPerCompany;
                    const end = Math.min(start + urlsPerCompany, allUrls.length);
                    const companyUrls = allUrls.slice(start, end);
                    if (companyUrls.length > 0) {
                        data[company] = companyUrls;
                    }
                });
            } else if (companies.length === 1) {
                // Single company found
                data[companies[0]] = allUrls;
            } else {
                // No clear companies found, try to extract from filename or use single group
                const companyName = fileName.replace(/\.(xlsx|xls)$/i, '').replace(/[-_]/g, ' ') || 'LeetCode Problems';
                data[companyName] = allUrls;
            }
            
            // If still no data, try one more approach: look for sheet indicators in the content
            if (Object.keys(data).length === 0 || (Object.keys(data).length === 1 && allUrls.length > 20)) {
                console.log('Trying alternative sheet detection...');
                
                // Look for patterns that might indicate sheet breaks
                const contentParts = content.split(/(?:sheet|worksheet|tab)/gi);
                if (contentParts.length > 1) {
                    const possibleSheetNames = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber'];
                    const distributedData = {};
                    
                    possibleSheetNames.forEach((name, index) => {
                        const startIdx = index * Math.floor(allUrls.length / possibleSheetNames.length);
                        const endIdx = (index + 1) * Math.floor(allUrls.length / possibleSheetNames.length);
                        const urls = allUrls.slice(startIdx, endIdx);
                        if (urls.length > 0) {
                            distributedData[name] = urls;
                        }
                    });
                    
                    if (Object.keys(distributedData).length > 0) {
                        Object.assign(data, distributedData);
                    }
                }
            }
            
            console.log('Final parsed data:', Object.keys(data).map(k => `${k}: ${data[k].length} URLs`));
            return data;
            
        } catch (error) {
            console.error('Simple Excel parsing failed:', error);
            throw error;
        }
    }

    function isValidLeetCodeURL(url) {
        const leetcodePattern = /https?:\/\/(www\.)?leetcode\.com\/problems\/[\w-]+\/?/i;
        return leetcodePattern.test(url);
    }

    function populateCompanySelect() {
        companySelect.innerHTML = '<option value="">Select a company...</option>';
        
        const companies = Object.keys(spreadsheetData).sort();
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = `${company} (${spreadsheetData[company].length} problems)`;
            companySelect.appendChild(option);
        });
        
        companySelect.disabled = false;
        
        // Restore previous selection after a small delay to ensure DOM is ready
        setTimeout(() => {
            if (userPreferences.selectedCompany && companies.includes(userPreferences.selectedCompany)) {
                console.log('Restoring company selection:', userPreferences.selectedCompany); // Debug
                companySelect.value = userPreferences.selectedCompany;
                updateStatsAndButton();
            }
        }, 100);
    }

    function onCompanyChange() {
        const selectedCompany = companySelect.value;
        console.log('Company changed to:', selectedCompany); // Debug log
        
        userPreferences.selectedCompany = selectedCompany;
        
        // Save immediately when company changes
        saveUserPreferences().then(() => {
            console.log('Company preference saved:', selectedCompany);
        }).catch(err => {
            console.error('Failed to save company preference:', err);
        });
        
        updateStatsAndButton();
    }

    function onQuestionCountChange() {
        userPreferences.questionCount = parseInt(questionCount.value) || 5;
        saveUserPreferences();
        updateStatsAndButton();
    }

    function onExcludeSolvedChange() {
        userPreferences.excludeSolved = excludeSolved.checked;
        saveUserPreferences();
        updateStatsAndButton();
    }

    function updateStatsAndButton() {
        const company = companySelect.value;
        
        if (!company || !spreadsheetData[company]) {
            statsSection.style.display = 'none';
            resetSolvedBtn.style.display = 'none';
            openProblemsBtn.disabled = true;
            return;
        }

        const allProblems = spreadsheetData[company];
        const companyKey = `${company}`;
        const companySolved = Array.from(solvedProblems).filter(url => 
            allProblems.includes(url)
        );
        
        const totalProblems = allProblems.length;
        const solvedCount = companySolved.length;
        const remainingCount = totalProblems - solvedCount;
        
        // Update stats display
        document.getElementById('totalProblems').textContent = totalProblems;
        document.getElementById('solvedProblems').textContent = solvedCount;
        document.getElementById('remainingProblems').textContent = remainingCount;
        
        statsSection.style.display = 'block';
        resetSolvedBtn.style.display = solvedCount > 0 ? 'block' : 'none';

        // Update button state
        const requestedCount = parseInt(questionCount.value) || 0;
        const availableProblems = userPreferences.excludeSolved ? 
            allProblems.filter(url => !solvedProblems.has(url)) : allProblems;
        
        const canOpen = company && requestedCount > 0 && availableProblems.length > 0;
        openProblemsBtn.disabled = !canOpen;
        
        // Update status message
        if (requestedCount > availableProblems.length && userPreferences.excludeSolved) {
            showStatus(`⚠️ Only ${availableProblems.length} unsolved problems available for ${company}`, 'info');
        } else if (requestedCount > totalProblems) {
            showStatus(`⚠️ Only ${totalProblems} total problems available for ${company}`, 'info');
        } else if (canOpen) {
            const problemSource = userPreferences.excludeSolved ? 'unsolved' : 'random';
            showStatus(`Ready to open ${Math.min(requestedCount, availableProblems.length)} ${problemSource} problems from ${company}`, 'info');
        }
    }

    async function openRandomProblems() {
        const company = companySelect.value;
        const count = parseInt(questionCount.value);
        
        console.log('Opening problems for company:', company, 'count:', count); // Debug
        
        if (!company || !count) {
            showStatus('❌ Please select a company and enter the number of questions.', 'error');
            return;
        }
        
        const allProblems = spreadsheetData[company];
        if (!allProblems || allProblems.length === 0) {
            showStatus('❌ No problems found for the selected company.', 'error');
            return;
        }

        // Filter problems based on user preference
        let availableProblems = allProblems;
        if (userPreferences.excludeSolved) {
            availableProblems = allProblems.filter(url => !solvedProblems.has(url));
            
            if (availableProblems.length === 0) {
                showStatus('🎉 All problems solved! Uncheck "Skip solved problems" to review them.', 'info');
                return;
            }
        }
        
        const selectedCount = Math.min(count, availableProblems.length);
        const selectedProblems = getRandomProblems(availableProblems, selectedCount);
        
        console.log(`Selected ${selectedProblems.length} problems:`, selectedProblems); // Debug log
        
        try {
            // Save user preferences first
            userPreferences.selectedCompany = company;
            userPreferences.questionCount = count;
            await saveUserPreferences();
            
            // Mark problems as solved
            selectedProblems.forEach(url => {
                solvedProblems.add(url);
            });
            
            // Save solved problems
            await saveSolvedProblems();
            
            // Show immediate feedback
            showStatus(`🚀 Opening ${selectedProblems.length} problems...`, 'info');
            
            // Method 1: Try Promise.all approach
            try {
                const promises = selectedProblems.map((url, index) => {
                    return chrome.tabs.create({ 
                        url: url, 
                        active: false
                    });
                });
                
                await Promise.all(promises);
                console.log(`Successfully opened ${selectedProblems.length} tabs with Promise.all`);
            } catch (promiseError) {
                console.warn('Promise.all method failed, trying sequential approach:', promiseError);
                
                // Method 2: Fallback to sequential opening with minimal delay
                for (let i = 0; i < selectedProblems.length; i++) {
                    try {
                        await new Promise(resolve => {
                            chrome.tabs.create({ 
                                url: selectedProblems[i], 
                                active: false
                            }, () => {
                                console.log(`Opened tab ${i + 1}:`, selectedProblems[i]);
                                resolve();
                            });
                        });
                        
                        // Small delay to prevent browser blocking
                        if (i < selectedProblems.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    } catch (tabError) {
                        console.error(`Error opening tab ${i + 1}:`, tabError);
                    }
                }
                console.log(`Sequential method completed for ${selectedProblems.length} tabs`);
            }
            
            // Update UI
            updateStatsAndButton();
            
            const problemType = userPreferences.excludeSolved ? 'new' : 'random';
            showStatus(`🎉 Opened ${selectedProblems.length} ${problemType} problems from ${company}!`, 'success');
            
            // Shorter delay before closing popup
            setTimeout(() => {
                window.close();
            }, 1500);
            
        } catch (error) {
            console.error('Error opening tabs:', error);
            showStatus('❌ Error opening tabs. Please check your browser settings.', 'error');
        }
    }

    function getRandomProblems(problems, count) {
        const shuffled = [...problems].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async function resetSolvedProblems() {
        const company = companySelect.value;
        if (!company) return;
        
        try {
            // Remove solved problems for this company
            const companyProblems = spreadsheetData[company];
            companyProblems.forEach(url => {
                solvedProblems.delete(url);
            });
            
            await saveSolvedProblems();
            updateStatsAndButton();
            showStatus(`🔄 Reset solved problems for ${company}`, 'success');
            
        } catch (error) {
            console.error('Error resetting solved problems:', error);
            showStatus('❌ Error resetting solved problems.', 'error');
        }
    }

    async function saveAllData() {
        try {
            await chrome.storage.local.set({ 
                spreadsheetData: spreadsheetData,
                lastUpdated: Date.now(),
                fileName: fileInput.files[0]?.name || 'Unknown file'
            });
        } catch (error) {
            console.error('Error saving spreadsheet data:', error);
        }
    }

    async function saveSolvedProblems() {
        try {
            await chrome.storage.local.set({ 
                solvedProblems: Array.from(solvedProblems)
            });
        } catch (error) {
            console.error('Error saving solved problems:', error);
        }
    }

    async function saveUserPreferences() {
        try {
            console.log('Saving preferences:', userPreferences); // Debug log
            await chrome.storage.local.set({ 
                userPreferences: userPreferences
            });
            console.log('Preferences saved successfully'); // Debug log
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    async function loadSavedData() {
        try {
            const result = await chrome.storage.local.get([
                'spreadsheetData', 
                'lastUpdated', 
                'fileName',
                'solvedProblems', 
                'userPreferences'
            ]);
            
            console.log('Loading saved data:', result); // Debug log
            
            // Load user preferences first
            if (result.userPreferences) {
                userPreferences = { ...userPreferences, ...result.userPreferences };
                console.log('Loaded preferences:', userPreferences); // Debug log
                
                // Restore UI state
                questionCount.value = userPreferences.questionCount;
                excludeSolved.checked = userPreferences.excludeSolved;
            }
            
            // Load solved problems
            if (result.solvedProblems && Array.isArray(result.solvedProblems)) {
                solvedProblems = new Set(result.solvedProblems);
            }
            
            // Load spreadsheet data
            if (result.spreadsheetData) {
                spreadsheetData = result.spreadsheetData;
                populateCompanySelect(); // This will restore company selection
                
                const lastUpdated = new Date(result.lastUpdated).toLocaleDateString();
                const fileName = result.fileName || 'Unknown file';
                updateFileStatus(`${fileName} (loaded ${lastUpdated})`, true);
                showStatus(`📋 Loaded saved data from ${lastUpdated}`, 'info');
            } else {
                updateFileStatus('No file uploaded', false);
            }
            
            updateStatsAndButton();
            
        } catch (error) {
            console.error('Error loading saved data:', error);
            updateFileStatus('Error loading data', false);
        }
    }

    async function clearAllData() {
        if (!confirm('Are you sure you want to clear all data including solved problems and preferences?')) {
            return;
        }
        
        try {
            await chrome.storage.local.clear();
            
            // Reset all variables
            spreadsheetData = {};
            solvedProblems = new Set();
            userPreferences = {
                selectedCompany: '',
                questionCount: 5,
                excludeSolved: true
            };
            
            // Reset UI
            companySelect.innerHTML = '<option value="">First upload a spreadsheet...</option>';
            companySelect.disabled = true;
            openProblemsBtn.disabled = true;
            resetSolvedBtn.style.display = 'none';
            statsSection.style.display = 'none';
            fileInput.value = '';
            questionCount.value = 5;
            excludeSolved.checked = true;
            updateFileStatus('No file uploaded', false);
            
            showStatus('🗑️ All data cleared successfully!', 'info');
        } catch (error) {
            console.error('Error clearing data:', error);
            showStatus('❌ Error clearing data.', 'error');
        }
    }

    function updateFileStatus(message, hasFile) {
        fileStatus.textContent = message;
        uploadBtn.style.display = hasFile ? 'none' : 'block';
        updateBtn.style.display = hasFile ? 'block' : 'none';
    }

    async function debugFileInfo() {
        const file = fileInput.files[0];
        if (!file) {
            showStatus('❌ No file selected. Please choose an Excel file first.', 'error');
            return;
        }
        
        try {
            console.log('=== DEBUG FILE INFO ===');
            console.log('File name:', file.name);
            console.log('File size:', file.size, 'bytes');
            console.log('File type:', file.type);
            console.log('Last modified:', new Date(file.lastModified));
            
            // Read the entire file
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Check file signatures
            const isXlsx = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // PK (ZIP signature)
            const isXls = uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF; // OLE signature
            
            console.log('File format detection:');
            console.log('- XLSX format (ZIP):', isXlsx);
            console.log('- XLS format (OLE):', isXls);
            
            // Try to decode as text with different encodings
            const encodings = ['utf-8', 'utf-16le', 'windows-1252'];
            let allText = '';
            
            for (const encoding of encodings) {
                try {
                    const decoder = new TextDecoder(encoding, { fatal: false });
                    const text = decoder.decode(uint8Array);
                    console.log(`\n=== Text decode with ${encoding} (first 2000 chars) ===`);
                    console.log(text.substring(0, 2000));
                    allText += text + ' ';
                } catch (e) {
                    console.log(`Failed to decode with ${encoding}:`, e.message);
                }
            }
            
            // Look for LeetCode URLs with various patterns
            console.log('\n=== SEARCHING FOR LEETCODE URLS ===');
            const urlPatterns = [
                /https?:\/\/(www\.)?leetcode\.com\/problems\/[\w-]+\/?/gi,
                /leetcode\.com\/problems\/[\w-]+/gi,
                /problems\/[\w-]+/gi,
                /two-sum|reverse-integer|add-two-numbers/gi // Common problem names
            ];
            
            let totalUrls = 0;
            urlPatterns.forEach((pattern, index) => {
                const matches = allText.match(pattern) || [];
                console.log(`Pattern ${index + 1} (${pattern}) found:`, matches.length, 'matches');
                if (matches.length > 0) {
                    console.log('First 5 matches:', matches.slice(0, 5));
                }
                totalUrls += matches.length;
            });
            
            // Look for sheet indicators
            console.log('\n=== SEARCHING FOR EXCEL SHEETS ===');
            const sheetPatterns = [
                /worksheets\/sheet\d+\.xml/gi,
                /sharedStrings\.xml/gi,
                /Google|Amazon|Microsoft|Facebook|Apple/gi, // Common company names
                /Sheet\d+/gi
            ];
            
            sheetPatterns.forEach((pattern, index) => {
                const matches = allText.match(pattern) || [];
                console.log(`Sheet pattern ${index + 1} found:`, matches.length, 'matches');
                if (matches.length > 0) {
                    console.log('Matches:', matches.slice(0, 10));
                }
            });
            
            // Try simple Excel parsing to see what we get
            console.log('\n=== ATTEMPTING SIMPLE PARSE ===');
            try {
                const simpleResult = await parseExcelSimple(arrayBuffer);
                console.log('Simple parse result:', simpleResult);
                console.log('Companies found:', Object.keys(simpleResult));
                Object.keys(simpleResult).forEach(company => {
                    console.log(`${company}: ${simpleResult[company].length} URLs`);
                    console.log('First 3 URLs:', simpleResult[company].slice(0, 3));
                });
            } catch (parseError) {
                console.log('Simple parse failed:', parseError.message);
            }
            
            // Try advanced parser (SheetJS)
            console.log('\n=== ATTEMPTING SHEETJS PARSE ===');
            try {
                const advancedResult = await SimpleExcelParser.parseExcelFile(file);
                console.log('SheetJS parse result:', advancedResult);
                console.log('Companies found:', Object.keys(advancedResult));
                Object.keys(advancedResult).forEach(company => {
                    console.log(`${company}: ${advancedResult[company].length} URLs`);
                    console.log('First 3 URLs:', advancedResult[company].slice(0, 3));
                });
            } catch (parseError) {
                console.log('SheetJS parse failed:', parseError.message);
            }
            
            // Try SheetJS raw workbook analysis
            console.log('\n=== SHEETJS RAW ANALYSIS ===');
            try {
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                console.log('Workbook loaded successfully!');
                console.log('Sheet names:', workbook.SheetNames);
                
                // Analyze each sheet
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                    console.log(`\nSheet "${sheetName}":`);
                    console.log('- Range:', worksheet['!ref']);
                    console.log('- Rows:', range.e.r + 1);
                    console.log('- Columns:', range.e.c + 1);
                    
                    // Show first few cells in column A
                    const columnAValues = [];
                    for (let row = 0; row <= Math.min(5, range.e.r); row++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
                        const cell = worksheet[cellAddress];
                        if (cell) {
                            columnAValues.push(`A${row + 1}: "${cell.v}"`);
                        }
                    }
                    console.log('- Column A samples:', columnAValues);
                });
            } catch (sheetjsError) {
                console.log('SheetJS raw analysis failed:', sheetjsError.message);
            }
            
            showStatus(`🔍 Debug complete. Found ${totalUrls} potential URLs. Check console for details.`, 'info');
            
        } catch (error) {
            console.error('Debug failed:', error);
            showStatus('❌ Debug failed: ' + error.message, 'error');
        }
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        // Auto-hide status after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
    }
});
