import React from "react";
import { useForm } from "@mantine/form";
import { yupResolver } from "mantine-form-yup-resolver";
import { signupSchema } from "../form/validations/signupSchema";
import { signupInitialValues } from "../form/initial-values/signupValues";
import styles from "./AuthForms.module.scss";
import { FInput, FButton, FTypography } from "../ui";
import { useMutation } from "@apollo/client/react";
import { UserSignUpDocument } from "@/generated/graphql";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

export default function SignupForm({
  onSwitchToLogin,
}: Readonly<{
  onSwitchToLogin: () => void;
}>) {
  const router = useRouter();
  const [signup, { loading }] = useMutation(UserSignUpDocument, {
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
        message: "Successfully created account!",
        color: "green",
      });
      router.push("/dashboard");
    },
  });

  const signupForm = useForm({
    initialValues: signupInitialValues,
    validate: yupResolver(signupSchema),
  });

  const handleSignup = (values: typeof signupInitialValues) => {
    signup({
      variables: {
        input: {
          name: values.name,
          email: values.email,
          password: values.password,
        },
      },
    });
  };

  const renderStrengthMeter = () => {
    const val = signupForm.values.password || "";
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const strengthColors = [
      "#EF4444",
      "#F59E0B",
      "var(--mantine-color-primary-accent-filled, #4e65de)",
      "#10B981",
    ];
    const strengthLabels = [
      "Weak password",
      "Fair password",
      "Good password",
      "Strong password",
    ];

    const bars = [0, 1, 2, 3].map((i) => {
      const bg =
        i < score && val.length > 0
          ? strengthColors[Math.max(score - 1, 0)]
          : "var(--border)";
      return (
        <div
          key={i}
          className={styles.strengthBar}
          style={{ background: bg }}
        />
      );
    });

    const hint =
      val.length === 0
        ? "Use 8+ characters with a number and a symbol."
        : strengthLabels[Math.max(score - 1, 0)];

    return (
      <>
        <div className={styles.strengthMeter}>{bars}</div>
        <div className={styles.fieldHint}>{hint}</div>
      </>
    );
  };

  return (
    <>
      <FTypography variant="title">Create your account</FTypography>
      <FTypography variant="description">
        Start chatting with your documents and knowledge workspaces in minutes.
      </FTypography>

      <form
        className={styles.form}
        onSubmit={signupForm.onSubmit(handleSignup)}
      >
        <FInput
          label="Full name"
          type="text"
          placeholder="John Doe"
          error={signupForm.errors.name as string}
          {...signupForm.getInputProps("name")}
        />

        <FInput
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={signupForm.errors.email as string}
          {...signupForm.getInputProps("email")}
        />

        <div className={styles.field}>
          <FInput
            label="Password"
            type="password"
            placeholder="Create a password"
            error={signupForm.errors.password as string}
            {...signupForm.getInputProps("password")}
          />
          {renderStrengthMeter()}
        </div>

        <FButton type="submit" loading={loading}>
          Create Account
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
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}>
          Log in
        </button>
      </div>
    </>
  );
}
