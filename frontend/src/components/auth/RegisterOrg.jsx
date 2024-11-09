import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CustomInput } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { CustomCheckbox } from "../ui/checkbox";
import { CustomTextarea } from "../ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressDetailsSchema, organizationDetailsSchema } from "@/validators/users";
import { useCreateOrganizationMutation } from "@/services/organization.service";

const RegisterOrg = () => {
  const [createOrganization] = useCreateOrganizationMutation();
  const [step, setStep] = useState(1);
  const [animationClass, setAnimationClass] = useState("");

  // Use appropriate resolver depending on the step
  const formSchema = step === 1 ? organizationDetailsSchema : addressDetailsSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    if (step === 1) {
      setAnimationClass("slide-enter");
      setTimeout(() => {
        setStep(2);
        setAnimationClass("slide-enter-active");
      }, 0);
    } else {
      try {
        const response = await createOrganization(data).unwrap();
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
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="w-full max-w-6xl bg-secondary/20 p-10 rounded-lg">
        <div className="bg-white dark:bg-black rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 p-6">
              <h1 className="text-3xl font-bold mb-6">Register</h1>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className={`space-y-4 min-h-[480px] ${animationClass} z-10`}
              >
                {step === 1 ? (
                  <OrganizationDetailsForm register={register} errors={errors} />
                ) : (
                  <AddressDetailsForm register={register} errors={errors} />
                )}
                <div className="flex justify-between">
                  {step === 2 && (
                    <Button type="button" variant="secondary" onClick={handleBack}>
                      Back
                    </Button>
                  )}
                  <Button type="submit" className="ml-auto">
                    {step === 1 ? "Next" : "Register"}
                  </Button>
                </div>
              </form>
            </div>
            <div className="md:w-1/2 p-8 flex items-center justify-center">
              <div className="max-w-md z-50">
                <img
                  src="/images/register-org.png"
                  alt="Meeting illustration"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrganizationDetailsForm = ({ register, errors }) => (
  <>
    <CustomInput
      label="Company Name"
      type="text"
      placeholder="Company Name"
      {...register("name")}
      error={errors.name}
    />
    <div className="grid grid-cols-2 gap-4">
      <CustomInput
        label="E-mail"
        type="email"
        placeholder="you@gmail.com"
        {...register("email")}
        error={errors.email}
      />
      <CustomInput
        label="Phone"
        type="text"
        placeholder="1234567890"
        {...register("phone")}
        error={errors.phone}
      />
    </div>
    <CustomInput
      type="text"
      placeholder="Website URL"
      label="Website"
      {...register("website")}
    />
    <CustomInput
      type="file"
      className="p-1 text-muted-foreground"
      label="Logo URL"
      {...register("logo")}
    />
    <CustomTextarea
      label="Description"
      placeholder="What does your company do?"
      {...register("description")}
      error={errors.description}
    />
  </>
);

const AddressDetailsForm = ({ register, errors }) => (
  <>
    <CustomTextarea
      placeholder="Enter your address"
      label="Address"
      {...register("address")}
      error={errors.address}
    />
    <div className="grid grid-cols-2 gap-4">
      <CustomInput
        label="City"
        {...register("city")}
        error={errors.city}
      />
      <CustomInput
        label="State"
        {...register("state")}
        error={errors.state}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <CustomInput
        label="Country"
        {...register("country")}
        error={errors.country}
      />
      <CustomInput
        label="Pincode"
        {...register("pincode")}
        error={errors.pincode}
      />
    </div>
    <CustomCheckbox
      id="terms"
      label={
        <>
          I agree to the{" "}
          <span className="text-primary font-medium">Terms and Conditions</span>{" "}
          and{" "}
          <span className="text-primary font-medium">Privacy Policy</span>
        </>
      }
      {...register("terms")}
      error={errors.terms}
    />
  </>
);

export default RegisterOrg;
