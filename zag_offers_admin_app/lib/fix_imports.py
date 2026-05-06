import os
import re

package_name = "zag_offers_admin_app"
root_dir = r"d:\offers\zag_offers_admin_app\lib"

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    file_rel_dir = os.path.relpath(os.path.dirname(file_path), root_dir).replace('\\', '/')
    if file_rel_dir == '.':
        file_rel_dir = ''

    for line in lines:
        match = re.match(r"import '(\.\.?/.*\.dart)';", line)
        if match:
            rel_path = match.group(1)
            # Calculate absolute path relative to lib
            abs_parts = file_rel_dir.split('/') if file_rel_dir else []
            rel_parts = rel_path.split('/')
            
            for part in rel_parts:
                if part == '..':
                    if abs_parts:
                        abs_parts.pop()
                elif part == '.':
                    continue
                else:
                    abs_parts.append(part)
            
            full_package_path = f"import 'package:{package_name}/{'/'.join(abs_parts)}';"
            new_lines.append(full_package_path + '\n')
        else:
            # Fix the broken imports from previous step
            if "import 'package:zag_offers_admin_app/features/features/" in line:
                 line = line.replace("import 'package:zag_offers_admin_app/features/features/", "import 'package:zag_offers_admin_app/features/")
            new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.dart'):
            fix_imports(os.path.join(root, file))
