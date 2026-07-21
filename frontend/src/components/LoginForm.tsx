import React from "react";
import { useForm } from "@mantine/form";
import { yupResolver } from "mantine-form-yup-resolver";
import { loginSchema } from "../form/validations/loginSchema";
import { loginInitialValues } from "../form/initial-values/loginValues";
import styles from "./AuthForms.module.scss";
import { FInput, FButton, FTypography } from "../ui";
import { useMutation } from "@apollo/client/react";
import { UserLoginDocument } from "@/generated/graphql";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

export default function LoginForm({
  onSwitchToSignup,
}: Readonly<{
  onSwitchToSignup: () => void;
}>) {
  const router = useRouter();
  const [login, { loading }] = useMutation(UserLoginDocument, {
    onError: (err) => {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    },
    onCompleted: () => {
      notifications.show({
        title: "Success",
        message: "Successfully logged in",
        color: "green",
      });
      router.push("/dashboard");
    },
  });

  const loginForm = useForm({
    initialValues: loginInitialValues,
    validate: yupResolver(loginSchema),
  });

  const handleLogin = (values: typeof loginInitialValues) => {
    login({
      variables: {
        input: {
          email: values.email,
          password: values.password,
        },
      },
    });
  };

  return (
    <>
      <FTypography variant="title">Welcome back</FTypography>
      <FTypography variant="description">
        Sign in to continue chatting with your documents and knowledge
        workspaces.
      </FTypography>

      <form className={styles.form} onSubmit={loginForm.onSubmit(handleLogin)}>
        <FInput
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={loginForm.errors.email as string}
          {...loginForm.getInputProps("email")}
        />

        <FInput
          label="Password"
          type="password"
          placeholder="Enter password"
          error={loginForm.errors.password as string}
          {...loginForm.getInputProps("password")}
        />

        <div className={styles.row}>
          <label className={styles.checkbox}>
            <input type="checkbox" />
            {""}Remember me
          </label>

          <p className={styles.forgot}>Forgot password?</p>
        </div>

        <FButton type="submit" loading={loading}>
          Sign In
        </FButton>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <div className={styles.socialRow}>
          <FButton type="button" variant="social">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3c-.19 1-.75 1.85-1.6 2.42v2h2.6c1.52-1.4 2.38-3.46 2.38-5.88z"
              />
              <path
                fill="#34A853"
                d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2c-.72.48-1.64.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.85v2.07C2.17 14.2 4.9 16 8 16z"
              />
              <path
                fill="#FBBC05"
                d="M3.53 9.54A4.8 4.8 0 013.27 8c0-.53.1-1.05.26-1.54V4.39H.85A8 8 0 000 8c0 1.29.31 2.51.85 3.61l2.68-2.07z"
              />
              <path
                fill="#EA4335"
                d="M8 3.17c1.18 0 2.23.4 3.06 1.2l2.3-2.3C11.96.9 10.15 0 8 0 4.9 0 2.17 1.8.85 4.39l2.68 2.07C4.16 4.57 5.92 3.17 8 3.17z"
              />
            </svg>
            Google
          </FButton>
        </div>
      </form>

      <div className={styles.footerText}>
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToSignup}>
          Create account
        </button>
      </div>
    </>
  );
}
