// Solved Problems Manager - Separate window for managing solved problems

let solvedProblems = new Set();
let selectedCompany = '';
let allProblems = [];
let userPreferences = {};

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closeBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectNoneBtn = document.getElementById('selectNoneBtn');
    const markUnsolvedBtn = document.getElementById('markUnsolvedBtn');
    const problemsContainer = document.getElementById('problemsContainer');
    const selectionCount = document.getElementById('selectionCount');

    // Event listeners
    closeBtn.addEventListener('click', () => window.close());
    selectAllBtn.addEventListener('click', selectAll);
    selectNoneBtn.addEventListener('click', selectNone);
    markUnsolvedBtn.addEventListener('click', markSelectedAsUnsolved);

    // Load data on startup
    loadData();

    async function loadData() {
        try {
            const result = await chrome.storage.local.get([
                'solvedProblems',
                'userPreferences', 
                'spreadsheetData'
            ]);

            if (result.solvedProblems) {
                solvedProblems = new Set(result.solvedProblems);
            }

            if (result.userPreferences) {
                userPreferences = result.userPreferences;
                selectedCompany = userPreferences.selectedCompany || '';
            }

            if (result.spreadsheetData && selectedCompany) {
                allProblems = result.spreadsheetData[selectedCompany] || [];
            }

            updateDisplay();

        } catch (error) {
            console.error('Error loading data:', error);
            showError('Failed to load data. Please refresh the page.');
        }
    }

    function updateDisplay() {
        if (!selectedCompany) {
            showError('No company selected. Please select a company in the main extension first.');
            return;
        }

        if (allProblems.length === 0) {
            showError('No problems found for the selected company.');
            return;
        }

        // Update company info
        document.getElementById('companyName').textContent = selectedCompany;

        // Get solved problems for this company
        const companySolved = allProblems.filter(url => solvedProblems.has(url));
        
        if (companySolved.length === 0) {
            showEmpty();
            return;
        }

        // Update stats
        document.getElementById('totalCount').textContent = allProblems.length;
        document.getElementById('solvedCount').textContent = companySolved.length;
        
        // Initially all solved problems will be skipped
        updateSkipCounts(companySolved.length, 0);

        // Render problems list
        renderProblemsList(companySolved);
        updateSelectionCount();
    }

    function updateSkipCounts(willSkip, canRetry) {
        document.getElementById('willSkipCount').textContent = willSkip;
        document.getElementById('canRetryCount').textContent = canRetry;
    }

    function renderProblemsList(problems) {
        const problemsHtml = problems.map(url => {
            const problemName = extractProblemName(url);
            
            return `
                <div class="problem-item will-skip" data-url="${url}">
                    <input type="checkbox" class="problem-checkbox" data-url="${url}">
                    <div class="problem-info">
                        <div class="problem-name">${problemName}</div>
                        <a href="${url}" target="_blank" class="problem-url">${url}</a>
                    </div>
                    <div class="problem-status status-will-skip">
                        Will Skip
                    </div>
                </div>
            `;
        }).join('');

        problemsContainer.innerHTML = `
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color will-skip"></div>
                    <span><strong>Will Skip:</strong> These won't appear in next batch</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color can-retry"></div>
                    <span><strong>Can Retry:</strong> Selected to be included in next batch</span>
                </div>
            </div>
            ${problemsHtml}
        `;

        // Add event listeners to checkboxes
        const checkboxes = problemsContainer.querySelectorAll('.problem-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const item = this.closest('.problem-item');
                const statusElement = item.querySelector('.problem-status');
                
                if (this.checked) {
                    // Will be marked as unsolved - can retry
                    item.className = 'problem-item can-retry';
                    statusElement.className = 'problem-status status-can-retry';
                    statusElement.textContent = 'Can Retry';
                } else {
                    // Will remain solved - will skip
                    item.className = 'problem-item will-skip';
                    statusElement.className = 'problem-status status-will-skip';
                    statusElement.textContent = 'Will Skip';
                }
                
                updateSelectionCount();
            });
        });
    }

    function extractProblemName(url) {
        const match = url.match(/\/problems\/([^\/\?]+)/);
        if (match) {
            return match[1]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        return 'Unknown Problem';
    }

    function updateSelectionCount() {
        const checkedBoxes = problemsContainer.querySelectorAll('.problem-checkbox:checked');
        const totalSolved = problemsContainer.querySelectorAll('.problem-checkbox').length;
        const selectedCount = checkedBoxes.length;
        
        selectionCount.textContent = `${selectedCount} problem${selectedCount !== 1 ? 's' : ''} selected`;
        markUnsolvedBtn.disabled = selectedCount === 0;

        // Update button text based on selection
        if (selectedCount === 0) {
            markUnsolvedBtn.textContent = 'Mark as Unsolved';
        } else {
            markUnsolvedBtn.textContent = `Mark ${selectedCount} as Unsolved`;
        }

        // Update skip counts
        const willSkipCount = totalSolved - selectedCount;
        const canRetryCount = selectedCount;
        updateSkipCounts(willSkipCount, canRetryCount);
    }

    function selectAll() {
        const checkboxes = problemsContainer.querySelectorAll('.problem-checkbox');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    function selectNone() {
        const checkboxes = problemsContainer.querySelectorAll('.problem-checkbox');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    async function markSelectedAsUnsolved() {
        const checkedBoxes = problemsContainer.querySelectorAll('.problem-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            return;
        }

        const confirmMessage = `Are you sure you want to mark ${checkedBoxes.length} problem${checkedBoxes.length !== 1 ? 's' : ''} as unsolved?\n\nThese problems will be included in future random selections.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Remove selected problems from solved set
            const unsolvedUrls = [];
            checkedBoxes.forEach(checkbox => {
                const url = checkbox.dataset.url;
                solvedProblems.delete(url);
                unsolvedUrls.push(url);
            });

            // Save to storage
            await chrome.storage.local.set({
                solvedProblems: Array.from(solvedProblems)
            });

            // Notify main popup if it's open
            try {
                chrome.runtime.sendMessage({ action: 'solved_problems_updated' });
            } catch (e) {
                // Main popup might not be open, ignore
            }

            // Show success message
            showSuccess(`✅ Successfully marked ${checkedBoxes.length} problem${checkedBoxes.length !== 1 ? 's' : ''} as unsolved!`);

            // Refresh display
            setTimeout(() => {
                updateDisplay();
            }, 1000);

        } catch (error) {
            console.error('Error updating solved problems:', error);
            showError('Failed to update solved problems. Please try again.');
        }
    }

    function showError(message) {
        problemsContainer.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    function showEmpty() {
        problemsContainer.innerHTML = `
            <div class="empty-state">
                <h3>🎉 No solved problems yet!</h3>
                <p>Start solving problems and they'll appear here for management.</p>
            </div>
        `;
    }

    function showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            max-width: 300px;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    // Handle window closing
    window.addEventListener('beforeunload', () => {
        // Notify parent window that data might have changed
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'solvedProblemsUpdated' }, '*');
        }
    });
});
