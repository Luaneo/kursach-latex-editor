import { useState } from "react";
import { useMutation } from "convex/react";
import { signInWithGoogle } from "../firebase";

export function LoginButton() {
    const [user, setUser] = useState<string | null>(null);
    const [hover, setHover] = useState(false);

    const loginMutation = useMutation("auth/login" as any);

    const handleLogin = () => {
    signInWithGoogle()
        .then((googleUser) => {
        const name = googleUser.displayName || googleUser.email || googleUser.uid;
        setUser(name);
        loginMutation({ uid: googleUser.uid, email: googleUser.email });
        })
        .catch((error) => console.error(error));
    };

  if (user) return <div>Привет, {user}!</div>;

  return (
    <button
      onClick={handleLogin}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: hover ? "oklch(0.424 0.199 265.638)" : "oklch(0.488 0.243 264.376)",
        color: "white",
        border: "none",
        borderRadius: "5px",
        transition: "background-color 0.2s",
      }}
    >
      Войти через Google
    </button>
  );
}
