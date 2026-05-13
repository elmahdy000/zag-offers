import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _otpSent = false;
  bool _isPasswordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('استعادة كلمة السر'),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            SnackBarUtils.showError(context, state.message);
          }
          if (state is ForgotPasswordSent) {
            setState(() => _otpSent = true);
            SnackBarUtils.showSuccess(context, 'تم إرسال كود التحقق إلى بريدك الإلكتروني');
          }
          if (state is ResetPasswordSuccess) {
            SnackBarUtils.showSuccess(context, 'تم تغيير كلمة السر بنجاح، يمكنك تسجيل الدخول الآن');
            Navigator.pop(context);
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  _buildHeader(),
                  const SizedBox(height: 32),
                  if (!_otpSent) ...[
                    _buildEmailField(),
                    const SizedBox(height: 24),
                    _buildSendButton(state),
                  ] else ...[
                    _buildOtpField(),
                    const SizedBox(height: 18),
                    _buildNewPasswordField(),
                    const SizedBox(height: 24),
                    _buildResetButton(state),
                    const SizedBox(height: 12),
                    _buildResendButton(state),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _otpSent ? 'تحقق من بريدك' : 'هل نسيت كلمة السر؟',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          _otpSent 
            ? 'أدخل الكود المكون من 6 أرقام الذي أرسلناه إلى ${_emailController.text}'
            : 'أدخل بريدك الإلكتروني المسجل وسنرسل لك كود لاستعادة حسابك.',
          style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      decoration: const InputDecoration(
        labelText: 'البريد الإلكتروني',
        hintText: 'example@mail.com',
        prefixIcon: Icon(Icons.email_outlined),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) return 'يرجى إدخال البريد الإلكتروني';
        if (!value.contains('@')) return 'يرجى إدخال بريد إلكتروني صحيح';
        return null;
      },
    );
  }

  Widget _buildOtpField() {
    return TextFormField(
      controller: _otpController,
      keyboardType: TextInputType.number,
      maxLength: 6,
      decoration: const InputDecoration(
        labelText: 'كود التحقق',
        hintText: '000000',
        prefixIcon: Icon(Icons.pin_outlined),
        counterText: '',
      ),
      validator: (value) {
        if (value == null || value.isEmpty) return 'يرجى إدخال كود التحقق';
        if (value.length < 6) return 'الكود يجب أن يكون 6 أرقام';
        return null;
      },
    );
  }

  Widget _buildNewPasswordField() {
    return TextFormField(
      controller: _newPasswordController,
      obscureText: !_isPasswordVisible,
      decoration: InputDecoration(
        labelText: 'كلمة السر الجديدة',
        hintText: '********',
        prefixIcon: const Icon(Icons.lock_outline_rounded),
        suffixIcon: IconButton(
          icon: Icon(
            _isPasswordVisible ? Icons.visibility_rounded : Icons.visibility_off_rounded,
          ),
          onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) return 'يرجى إدخال كلمة السر الجديدة';
        if (value.length < 6) return 'يجب أن تكون 6 أحرف على الأقل';
        return null;
      },
    );
  }

  Widget _buildSendButton(AuthState state) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: state is AuthLoading ? null : () {
          if (_formKey.currentState!.validate()) {
            context.read<AuthBloc>().add(ForgotPasswordRequested(_emailController.text.trim()));
          }
        },
        child: state is AuthLoading 
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('إرسال الكود'),
      ),
    );
  }

  Widget _buildResetButton(AuthState state) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: state is AuthLoading ? null : () {
          if (_formKey.currentState!.validate()) {
            context.read<AuthBloc>().add(ResetPasswordSubmitted(
              email: _emailController.text.trim(),
              otp: _otpController.text.trim(),
              newPassword: _newPasswordController.text,
            ));
          }
        },
        child: state is AuthLoading 
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('تغيير كلمة السر'),
      ),
    );
  }

  Widget _buildResendButton(AuthState state) {
    return Center(
      child: TextButton(
        onPressed: state is AuthLoading ? null : () {
          context.read<AuthBloc>().add(ForgotPasswordRequested(_emailController.text.trim()));
        },
        child: const Text('إعادة إرسال الكود؟'),
      ),
    );
  }
}
