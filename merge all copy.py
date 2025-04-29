import os
import shutil


def merge_server_files(source_folder, output_file):
    with open(output_file, "w", encoding="utf-8") as outfile:
        # First process routes, then controllers
        for folder_type in ["routes", "controllers"]:
            outfile.write(f"\n\n{'=' * 50}\n{folder_type.upper()}\n{'=' * 50}\n\n")

            # Walk through all service directories in server folder
            for root, dirs, files in os.walk(os.path.join(source_folder, "server")):
                # Skip node_modules and other unnecessary directories
                dirs[:] = [
                    d for d in dirs if d not in ["node_modules", ".next", "dist"]
                ]

                # Check if we're in a routes or controllers folder
                if folder_type in root.lower():
                    # Filter JavaScript files
                    js_files = [f for f in files if f.endswith((".js", ".ts"))]
                    js_files.sort()

                    # Get service name from path
                    service_name = os.path.basename(
                        os.path.dirname(os.path.dirname(root))
                    )

                    for file in js_files:
                        file_path = os.path.join(root, file)
                        # Add service and file information as headers
                        outfile.write(f"\n\n/* Service: {service_name} */\n")
                        outfile.write(f"/* File: {file} */\n")
                        print(f"Adding: {file_path}")

                        try:
                            with open(file_path, "r", encoding="utf-8") as infile:
                                content = infile.read()
                                outfile.write(content)
                                outfile.write("\n")
                        except UnicodeDecodeError:
                            print(
                                f"Warning: Unable to read {file_path} with UTF-8 encoding. Skipping file."
                            )


# Example usage
source_folder = "./"  # Root project folder
output_file = "server_documentation.md"
merge_server_files(source_folder, output_file)
