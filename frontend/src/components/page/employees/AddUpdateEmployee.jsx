import React, { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, BadgeCheck, BadgeAlert } from "lucide-react";
import { CustomTooltip } from "@/components/ui/tooltip";
import useDebounce from "@/hooks/useDebounce";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetAllRoleNameQuery,
  useGetAllDepartmentNameQuery,
  useCheckUsernameMutation,
  useCheckEmailMutation,
  useGetUserDetailsQuery,
} from "@/services/api.service";
import { useToaster } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmpassword: z.string().optional(),
    role: z.string().nonempty("Role is required"),
    firstname: z.string().nonempty("First name is required"),
    lastname: z.string().nonempty("Last name is required"),
    department: z.string().nonempty("Department is required"),
    employee_id: z.string().nonempty("Employee ID is required"),
    phone_number: z.string().optional(),
    is_active: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.password || data.confirmpassword) {
        return data.password === data.confirmpassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmpassword"],
    }
  );

const AddUpdateEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToaster();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: user, isLoading: isUserLoading } = useGetUserDetailsQuery(id, {
    skip: !id,
  });
  const { data: roles } = useGetAllRoleNameQuery();
  const { data: departments } = useGetAllDepartmentNameQuery();
  const [checkUsername, { isLoading: checkingUsername }] =
    useCheckUsernameMutation();
  const [checkEmail, { isLoading: checkingEmail }] = useCheckEmailMutation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(undefined);
  const [isEmailAvailable, setIsEmailAvailable] = useState(undefined);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
      role: "",
      firstname: "",
      lastname: "",
      department: "",
      employee_id: "",
      phone_number: "",
      is_active: true,
    },
  });

  React.useEffect(() => {
    if (user) {
      reset(user);
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user, reset]);

  const checkIfUsernameExists = useCallback(
    async (username) => {
      if (!username || (id && user?.username === username)) return;
      if (username.length < 3) {
        setIsUsernameAvailable(false);
        setError("username", {
          type: "manual",
          message: "Username must be at least 3 characters long",
        });
        return;
      }
      try {
        const response = await checkUsername({ username }).unwrap();
        setIsUsernameAvailable(!response.exists);
        if (response.exists) {
          setError("username", {
            type: "manual",
            message: "Username is already taken",
          });
        } else {
          clearErrors("username");
        }
      } catch (error) {
        console.error(error);
        setIsUsernameAvailable(false);
        setError("username", {
          type: "manual",
          message: "Error checking username availability",
        });
      }
    },
    [checkUsername, setError, clearErrors, id, user]
  );

  const checkIfEmailExists = useCallback(
    async (email) => {
      if (!email || (id && user?.email === email)) return;
      try {
        const response = await checkEmail({ email }).unwrap();
        setIsEmailAvailable(!response.exists);
        if (response.exists) {
          setError("email", {
            type: "manual",
            message: "Email is already in use",
          });
        } else {
          clearErrors("email");
        }
      } catch (error) {
        console.error(error);
        setIsEmailAvailable(false);
        setError("email", {
          type: "manual",
          message: "Error checking email availability",
        });
      }
    },
    [checkEmail, setError, clearErrors, id, user]
  );

  useDebounce(email, 700, checkIfEmailExists);
  useDebounce(username, 700, checkIfUsernameExists);

  const onSubmit = async (data) => {
    try {
      if (id) {
        delete data.id;
        delete data.email;
        await updateUser({id, data}).unwrap();
        toast.success("Employee updated successfully");
      } else {
        delete data.confirmpassword;
        await createUser(data).unwrap();
        toast.success("Employee added successfully");
      }
      navigate("/employees");
    } catch (error) {
      toast.error(error.data.message);
    }
  };

  useEffect(() => {
    console.log("User:", user);
    if (user) {
      Object.keys(user).forEach((key) => {
        setValue(key, user[key]);
      });
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user, setValue]);

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AddUpdatePageLayout title={id ? "Update Employee" : "Add Employee"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <CustomInput
            label="First Name"
            {...register("firstname")}
            error={errors.firstname}
          />
          <CustomInput
            label="Last Name"
            {...register("lastname")}
            error={errors.lastname}
          />
        </div>

        <div className="relative">
          <CustomInput
            label="Username"
            {...register("username", {
              onChange: (e) => setUsername(e.target.value),
            })}
            error={errors.username}
          />
          {username && (
            <div className="absolute right-2 top-8">
              {isUsernameAvailable === undefined || checkingUsername ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : isUsernameAvailable ? (
                <CustomTooltip content="Username is available">
                  <BadgeCheck className="text-green-500" size={20} />
                </CustomTooltip>
              ) : (
                <CustomTooltip
                  content={
                    errors.username?.message || "Username is not available"
                  }
                >
                  <BadgeAlert className="text-red-500" size={20} />
                </CustomTooltip>
              )}
            </div>
          )}
        </div>
        {!id && (
          <>
            <div className="relative">
              <CustomInput
                label="Email"
                {...register("email", {
                  onChange: (e) => setEmail(e.target.value),
                })}
                error={errors.email}
              />
              {email && (
                <div className="absolute right-2 top-8">
                  {isEmailAvailable === undefined || checkingEmail ? (
                    <Loader2 size={20} className="animate-spin text-primary" />
                  ) : isEmailAvailable ? (
                    <CustomTooltip content="Email is available">
                      <BadgeCheck className="text-green-500" size={20} />
                    </CustomTooltip>
                  ) : (
                    <CustomTooltip
                      content={
                        errors.email?.message || "Email is not available"
                      }
                    >
                      <BadgeAlert className="text-red-500" size={20} />
                    </CustomTooltip>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput
                label="Password"
                type="password"
                {...register("password")}
                error={errors.password}
              />
              <CustomInput
                label="Confirm Password"
                type="password"
                {...register("confirmpassword")}
                error={errors.confirmpassword}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="Role"
            name="role"
            rules={{ required: "Role is required" }}
            control={control}
            options={roles?.map((role) => ({
              label: role.name,
              value: role._id,
            }))}
            placeholder="Select a role"
            error={errors.role}
          />
          <CustomSelect
            label="Department"
            name="department"
            rules={{ required: "Department is required" }}
            control={control}
            options={departments?.map((dept) => ({
              label: dept.name,
              value: dept._id,
            }))}
            placeholder="Select a department"
            error={errors.department}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomInput
            label="Employee ID"
            {...register("employee_id")}
            error={errors.employee_id}
          />
          <CustomInput
            label="Phone Number"
            {...register("phone_number")}
            error={errors.phone_number}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="is_active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label htmlFor="is_active">Is Active</label>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/employees")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {id ? "Update" : "Add"} Employee
            {(isCreating || isUpdating) && (
              <Loader2 className="ml-2 animate-spin" size={20} />
            )}
          </Button>
        </div>
      </form>
    </AddUpdatePageLayout>
  );
};

export default AddUpdateEmployee;
