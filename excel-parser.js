class SimpleExcelParser {
    static async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });

                    const result = {};

                    workbook.SheetNames.forEach((sheetName) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        const urls = [];
                        rows.forEach(row => {
                            const cell = row[0]; // Only first column
                            if (typeof cell === "string" && cell.includes("leetcode.com")) {
                                const match = cell.match(/https?:\/\/leetcode\.com\/problems\/[\w-]+\/?/gi);
                                if (match) urls.push(...match);
                            }
                        });

                        if (urls.length > 0) {
                            result[sheetName] = [...new Set(urls)];
                        }
                    });

                    if (Object.keys(result).length === 0) {
                        reject(new Error("No LeetCode URLs found in the Excel file."));
                    } else {
                        resolve(result);
                    }
                } catch (err) {
                    reject(new Error(`Error parsing Excel file: ${err.message}`));
                }
            };

            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsArrayBuffer(file);
        });
    }
}

window.SimpleExcelParser = SimpleExcelParser;
