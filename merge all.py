import os
import shutil


def merge_js_files(source_folder, output_file):
    # Create or clear the output file with UTF-8 encoding
    with open(output_file, "w", encoding="utf-8") as outfile:
        # Walk through all directories and subdirectories
        for root, dirs, files in os.walk(source_folder):
            # Skip node_modules and .next directories
            if "node_modules" in dirs:
                dirs.remove("node_modules")
            if ".next" in dirs:
                dirs.remove(".next")

            # Filter JavaScript and JSX files
            js_files = [
                f for f in files if f.endswith((".js", ".jsx", ".css", ".dart"))
            ]

            # Sort files to ensure consistent order
            js_files.sort()

            # Process each JavaScript file
            for file in js_files:
                file_path = os.path.join(root, file)
                print(f"Adding: {file_path}")

                # Add a file separator comment for clarity
                outfile.write(f"\n/* File: {file_path} */\n")

                try:
                    # Read and append the file content with UTF-8 encoding
                    with open(file_path, "r", encoding="utf-8") as infile:
                        content = infile.read()
                        outfile.write(content)
                        outfile.write("\n")
                except UnicodeDecodeError:
                    print(
                        f"Warning: Unable to read {file_path} with UTF-8 encoding. Skipping file."
                    )


# Example usage
source_folder = "./"  # Replace with your source folder if needed
output_file = "merged_all.txt"  # Replace with your desired output file if needed
merge_js_files(source_folder, output_file)
