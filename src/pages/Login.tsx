import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

const schema = Yup.object({
  email: Yup.string()
    .email("You need to enter a valid email")
    .required("You need to enter a valid email"),
  password: Yup.string().required("You need to enter a valid password").min(6),
});

type ValueType = Yup.InferType<typeof schema>;


export default function Login() {
  const { login } = useAuth();
  const { brand } = useBrand();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  const formik = useFormik<ValueType>({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ email, password }) => {
      setLoginError("");
      const result = await login(email, password);
      if (!result.success && result.error) {
        setLoginError(result.error);
      }
    },
    validationSchema: schema
  });

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");
  //   setLoading(true);

  //   const success = login(email, password);
  //   if (!success) {
  //     setError("Invalid email or password");
  //   }
  //   setLoading(false);
  // ;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${brand.sidebarGradientFrom} 0%, ${brand.sidebarGradientTo} 50%, ${brand.primaryLight} 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                brand.logoEmoji
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{brand.tagline}</p>
          </div>

          {formik.touched.email && formik.errors.email && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />
              {formik.errors.email}
            </div> )}

          {loginError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...formik.getFieldProps("email")}
                type="email"
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>
            {formik.touched.password && formik.errors.password && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />
              {formik.errors.password}
            </div> )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...formik.getFieldProps("password")}
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {formik.isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">
              Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                
                className="btn-secondary text-xs py-2"
              >
                👑 CEO Login
              </button>
              <button
                
                className="btn-secondary text-xs py-2"
              >
                👤 Staff Login
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
