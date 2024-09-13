import { useForm } from "react-hook-form";
import {
  useCreateSuperAdminMutation,
//   useOtpGenerateMutation,
} from "@/services/api.service";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { CustomInput } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const SuperAdmin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [superAdmin] = useCreateSuperAdminMutation();

  const [step, setStep] = useState(1);
  const [animationClass, setAnimationClass] = useState("");

  //   const [generateOtp] = useOtpGenerateMutation();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  console.log(id);

  const onSubmit = async (data) => {
    if (step === 1) {
      const { password, confirmpassword } = data;
      if (password !== confirmpassword) {
        toast.error("Passwords do not match. Please try again.");
        return;
      }
      //   const response = await generateOtp({ organization_id: id }).unwrap();
      //   console.log(response);
      setAnimationClass("slide-enter");
      setTimeout(() => {
        setStep(2);
        setAnimationClass("slide-enter-active");
      }, 0);
    } else {
      try {
        const response = await superAdmin(data).unwrap();
        console.log(response);
        if (response) {
          toast.success("Register successful!");
        } else {
          toast.error("Something went wrong! Please try again later.");
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleBack = () => {
    setAnimationClass("slide-back-enter");
    setTimeout(() => {
      setStep(1);
      setAnimationClass("slide-back-enter-active");
    }, 0);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-6xl bg-preprimary rounded-l-[2.5rem] rounded-r-[3rem]">
        <div className="">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/5 flex items-center justify-center">
              <div className="max-w-md z-50">
                <img
                  src="/images/super-admin.png"
                  alt="Meeting illustration"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="md:w-3/5 p-6 bg-white rounded-[2.5rem]">
              <h1 className="text-3xl font-bold mb-6">Super Admin</h1>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className={`space-y-4 min-h-[480px] ${animationClass} z-10`}
              >
                {step === 1 ? (
                  <SuperAdminDetailsForm register={register} errors={errors} />
                ) : (
                  <OTP register={register} errors={errors} />
                )}
                <div className="flex justify-between">
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                  <Button type="submit" className="ml-auto">
                    {step === 1 ? "Next" : "Register"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDetailsForm = ({ register, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <CustomInput
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          {...register("firstname", {
            required: "Firstname is required",
          })}
          error={errors.firstname}
        />
        <CustomInput
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          {...register("lastname", {
            required: "Lastname is required",
          })}
          error={errors.lastname}
        />
      </div>
      <CustomInput
        type="text"
        label="Username"
        placeholder="Enter your username"
        {...register("username", {
          required: "Username is required",
        })}
        error={errors.username}
      />
      <CustomInput
        label="E-mail"
        type="email"
        placeholder="you@gmail.com"
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        })}
        error={errors.email}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <CustomInput
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password", {
              required: "Password is required",
            })}
            error={errors.password}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute top-6 inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          >
            {showPassword ? (
              <EyeOff className="text-gray-400" />
            ) : (
              <Eye className="text-gray-400" />
            )}
          </button>
        </div>
        <div className="relative">
          <CustomInput
            label="Confirm-Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Enter your confirm password"
            {...register("confirmpassword", {
              required: "Confirm Password is required",
            })}
            error={errors.confirmpassword}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute top-6 inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          >
            {showConfirmPassword ? (
              <EyeOff className="text-gray-400" />
            ) : (
              <Eye className="text-gray-400" />
            )}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CustomInput
          label="Employee-ID"
          type="text"
          placeholder="Enter your Employee-ID"
          {...register("employee_id", {
            required: "Employee-ID is required",
          })}
          error={errors.employee_id}
        />
        <CustomInput
          label="Phone"
          type="number"
          placeholder="Enter your phone number"
          {...register("phone", {
            pattern: {
              value: /^[0-9]{10}$/i,
              message: "Invalid phone number",
            },
          })}
          error={errors.phone}
        />
      </div>
    </>
  );
};

const OTP = ({ register, errors }) => {
  return (
    <>
      <CustomInput
        placeholder="Enter your OTP"
        label="OTP"
        {...register("otp", { required: "OTP is required" })}
        error={errors.otp}
      />
    </>
  );
};

export default SuperAdmin;
