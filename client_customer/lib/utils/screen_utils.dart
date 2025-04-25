// lib/utils/screen_utils.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ScreenUtil {
  static void init(
    BuildContext context, {
    Size designSize = const Size(360, 690),
  }) {
    ScreenUtilInit(designSize: designSize, builder: (_, __) => Container());
  }

  static double setWidth(double width) => width.w;
  static double setHeight(double height) => height.h;
  static double setRadius(double radius) => radius.r;
  static double setSp(double fontSize) => fontSize.sp;
}
