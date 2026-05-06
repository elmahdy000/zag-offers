import os
import re

package_name = "zag_offers_admin_app"
lib_dir = r"d:\offers\zag_offers_admin_app\lib"

mappings = [
    (r"features/([^/]+)/entities/", r"features/\1/domain/entities/"),
    (r"features/([^/]+)/repositories/", r"features/\1/domain/repositories/"),
    (r"features/([^/]+)/datasources/", r"features/\1/data/datasources/"),
    (r"features/([^/]+)/models/", r"features/\1/data/models/"),
    (r"features/([^/]+)/bloc/", r"features/\1/presentation/bloc/"),
    (r"features/([^/]+)/pages/", r"features/\1/presentation/pages/"),
    (r"features/([^/]+)/widgets/", r"features/\1/presentation/widgets/"),
    # Fix double-nested if they happened
    (r"domain/domain/", r"domain/"),
    (r"data/data/", r"data/"),
    (r"presentation/presentation/", r"presentation/"),
]

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for pattern, replacement in mappings:
        content = re.sub(pattern, replacement, content)

    # Specific common fixes
    content = content.replace("package:zag_offers_admin_app/features/models/category_model.dart", "package:zag_offers_admin_app/features/categories/data/models/category_model.dart")
    content = content.replace("package:zag_offers_admin_app/features/models/coupon_model.dart", "package:zag_offers_admin_app/features/coupons/data/models/coupon_model.dart")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            fix_file(os.path.join(root, file))
