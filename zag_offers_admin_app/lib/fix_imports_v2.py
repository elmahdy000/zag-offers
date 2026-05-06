import os
import re

package_name = "zag_offers_admin_app"
lib_dir = r"d:\offers\zag_offers_admin_app\lib"

# Map of common folders to their relative positions
folders = ["domain", "data", "presentation", "core"]

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the double /../ or malformed package paths
    content = content.replace(f"package:{package_name}/../", f"package:{package_name}/")
    
    # 2. Fix cases where features/ was inserted but the actual feature name was skipped
    # Example: package:zag_offers_admin_app/features/domain/entities/coupon.dart
    # Should be: package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart
    
    # We can use the file's own path to guess the feature if it's inside features/
    rel_to_lib = os.path.relpath(file_path, lib_dir).replace('\\', '/')
    parts = rel_to_lib.split('/')
    
    current_feature = None
    if len(parts) > 1 and parts[0] == 'features':
        current_feature = parts[1]

    # Find all package imports starting with features/ but missing the feature name
    # We'll look for imports that go straight to domain/data/presentation
    pattern = rf"package:{package_name}/features/(domain|data|presentation|datasources|repositories|models|bloc|pages|entities)/"
    
    def replacement(match):
        subfolder = match.group(1)
        if current_feature:
            # Try to see if it's a cross-feature import or same-feature
            # For now, if it's missing the feature name, it's likely intended for the CURRENT feature
            return f"package:{package_name}/features/{current_feature}/{subfolder}/"
        return match.group(0)

    content = re.sub(pattern, replacement, content)

    # 3. Handle specific missing feature names if known
    # (e.g. if we see coupon.dart, it's definitely coupons feature)
    content = content.replace("features/entities/coupon.dart", "features/coupons/domain/entities/coupon.dart")
    content = content.replace("features/models/coupon_model.dart", "features/coupons/data/models/coupon_model.dart")
    content = content.replace("features/repositories/coupon_repository.dart", "features/coupons/domain/repositories/coupon_repository.dart")
    content = content.replace("features/datasources/coupon_remote_datasource.dart", "features/coupons/data/datasources/coupon_remote_datasource.dart")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            fix_file(os.path.join(root, file))
