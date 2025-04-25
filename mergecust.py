import os
import shutil

def merge_dart_files(source_folder, output_file):
    # Create or clear the output file with UTF-8 encoding
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Walk through all directories and subdirectories
        for root, dirs, files in os.walk(source_folder):
            # Skip unwanted directories
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.next' in dirs:
                dirs.remove('.next')

            # Filter Dart files
            dart_files = [f for f in files if f.endswith('.dart')]
            dart_files.sort()  # Ensure consistent order

            # Process each Dart file
            for file in dart_files:
                file_path = os.path.join(root, file)
                print(f"Adding: {file_path}")

                # Write a comment separator for clarity
                outfile.write(f"\n/* File: {os.path.relpath(file_path, source_folder)} */\n")

                # Read and write file content
                with open(file_path, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                    outfile.write('\n')  # Separate files with a newline

# Example usage
source_folder = "./client_customer/lib"
output_file = "merged_cust.txt"
merge_dart_files(source_folder, output_file)
