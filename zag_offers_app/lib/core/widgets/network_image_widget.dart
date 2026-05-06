import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'skeleton_loader.dart';

class NetworkImageWidget extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const NetworkImageWidget({
    super.key,
    this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _buildPlaceholder();
    }

    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: CachedNetworkImage(
        imageUrl: imageUrl!,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) => const Skeleton(
          width: double.infinity,
          height: double.infinity,
        ),
        errorWidget: (context, url, error) => _buildPlaceholder(),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: borderRadius,
      ),
      child: Icon(
        Icons.image_not_supported_outlined,
        color: Colors.grey[400],
        size: (width != null && width! < 50) ? 20 : 30,
      ),
    );
  }
}
