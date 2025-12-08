# Career Path Data Management

We have simplified the process of updating career path data. Instead of editing complex JSON files, you can now manage data using Excel/CSV files.

## Files
You will find two new files in `src/assets/data/`:
1. **[nodes.csv](src/assets/data/nodes.csv)**: Contains all career roles (nodes).
2. **[paths.csv](src/assets/data/paths.csv)**: Defines the connections between roles (paths).

## How to Update Data

1. **Edit CSV Files**:
   - Open `nodes.csv` or `paths.csv` in Excel or any text editor.
   - Add, edit, or remove rows as needed.
   - Save the file (keep CSV format).

   > [!IMPORTANT]
   > - **Requirements List**: In `nodes.csv`, the `requirements` column allows multiple items. Separate them with a semicolon `;` (e.g., `MBO Nursing; BIG Registration`).
   > - **IDs**: The `id` column in `nodes.csv` must be unique.
   > - **Linking**: In `paths.csv`, the `from` and `to` columns MUST match a valid `id` from `nodes.csv`.

2. **Run Update Script**:
   - Open your terminal in the project folder.
   - Run the following command:
     ```bash
     npm run data:update
     ```
   - This script reads your CSV files and automatically updates `career-nodes.json` and `career-paths.json`.

3. **Verify**:
   - Check the console output for any warnings (e.g., if a path refers to a missing node ID).
   - Reload the application to see your changes.

## Exporting Data (Optional)
If you make changes directly to the JSON files or lose your CSVs, you can regenerate the CSV files from the current app data:
```bash
npm run data:export
```
> [!WARNING]
> This will overwrite the existing `nodes.csv` and `paths.csv` files.

## Troubleshooting
- **"ID not found"**: You added a path but the role ID doesn't exist in `nodes.csv`. Check for typos.
- **Formatting issues**: Ensure you do not remove the header row in the CSV files.