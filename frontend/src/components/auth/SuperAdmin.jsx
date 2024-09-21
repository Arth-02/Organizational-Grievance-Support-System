import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateSuperAdminMutation,
  useOtpGenerateMutation,
} from "@/services/api.service";
import toast from "react-hot-toast";
import { CustomInput } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { SuperAdminSchema } from "@/validators/users";
import { useSearchParams } from "react-router-dom";
import { CustomOTPInput } from "../ui/input-otp";


const SuperAdmin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SuperAdminSchema),
  });

  const [superAdmin] = useCreateSuperAdminMutation();
  const [generateOtp] = useOtpGenerateMutation();

  const [step, setStep] = useState(2);
  const [animationClass, setAnimationClass] = useState("");

  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("id");

  const onSubmit = async (data) => {
    if (step === 1) {
      const { password, confirmpassword } = data;
      if (password !== confirmpassword) {
        toast.error("Passwords do not match. Please try again.");
        return;
      }
      try {
        const response = await generateOtp({ organization_id: organizationId }).unwrap();
        if (!response) {
          toast.error("Error generating OTP. Please try again.");
          return;
        }
        setAnimationClass("slide-enter");
        setTimeout(() => {
          setStep(2);
          setAnimationClass("slide-enter-active");
        }, 0);
      } catch (error) {
        console.log(error)
        toast.error("Error generating OTP. Please try again.");
      }
    } else {
      try {
        const response = await superAdmin(data).unwrap();
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-7xl bg-preprimary rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row shadow-custom rounded-[2.5rem]">
          <div className="md:w-2/5 hidden md:flex items-center justify-center">
            <div className="max-w-md p-6 z-50">
              <img
                src="/images/super-admin.png"
                alt="Meeting illustration"
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="md:w-3/5 p-6 px-10 bg-white rounded-[2.5rem]">
            <h1 className="text-3xl font-bold my-6 mb-8">Super Admin</h1>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className={`space-y-4 min-h-[500px] ${animationClass} z-10`}
            >
              {step === 1 ? (
                <SuperAdminDetailsForm register={register} errors={errors} />
              ) : (
                <OTPForm register={register} errors={errors} />
              )}
              <div className="flex justify-between !mt-8">
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
  );
};

const SuperAdminDetailsForm = ({ register, errors }) => {

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <CustomInput
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          {...register("firstname")}
          error={errors.firstname}
        />
        <CustomInput
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          {...register("lastname")}
          error={errors.lastname}
        />
      </div>
      <CustomInput
        type="text"
        label="Username"
        placeholder="Enter your username"
        {...register("username")}
        error={errors.username}
      />
      <CustomInput
        label="E-mail"
        type="email"
        placeholder="you@gmail.com"
        {...register("email")}
        error={errors.email}
      />
      <div className="grid grid-cols-2 gap-4">
          <CustomInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
            error={errors.password}
          />
          <CustomInput
            label="Confirm-Password"
            type="password"
            placeholder="Enter your confirm password"
            {...register("confirmpassword")}
            error={errors.confirmpassword}
          />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CustomInput
          label="Employee-ID"
          type="text"
          placeholder="Enter your Employee-ID"
          {...register("employee_id")}
          error={errors.employee_id}
        />
        <CustomInput
          label="Phone"
          type="text"
          placeholder="Enter your phone number"
          {...register("phone_number")}
          error={errors.phone_number}
        />
      </div>
    </>
  );
};

const OTPForm = ({ register, errors }) => {
  return (
    // <CustomInput
    //   placeholder="Enter your OTP"
    //   label="OTP"
    //   {...register("otp")}
    //   error={errors.otp}
    // />
    <CustomOTPInput
      label="OTP"
      maxLength={6}
      {...register("otp")}
      error={errors.otp}
    />
  );
};

export default SuperAdmin;
