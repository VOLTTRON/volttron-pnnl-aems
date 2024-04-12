import { merge } from "lodash";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import styles from "@/app/sample/page.module.css";
import { getProvider as getProviderInfo } from "@/auth";
import { lucia } from "@/auth/lucia";
import { getProvider } from "@/auth/server";

export default async function Page(props: { params: { provider: string } }) {
  const provider = getProviderInfo(props.params.provider);
  if (!provider) {
    notFound();
  }
  const { name, label, credentials } = provider;
  return (
    <div className={styles.card}>
      <h1>{label}</h1>
      <h2>Sign in</h2>
      <form action={login(name)}>
        {Object.entries(credentials).map(([name, { label, type, placeholder }]) => {
          switch (type) {
            case "text":
              return (
                <>
                  <label key={name} htmlFor={name}>
                    {label}
                  </label>
                  <input key={name} name={name} id={name} placeholder={placeholder} />
                  <br key={name} />
                </>
              );
            case "password":
              return (
                <>
                  <label key={name} htmlFor={name}>
                    {label}
                  </label>
                  <input key={name} type="password" name={name} id={name} placeholder={placeholder} />
                  <br key={name} />
                </>
              );
            default:
              throw new Error(`Unknown credential type: ${type}`);
          }
        })}
        <button>Continue</button>
      </form>
    </div>
  );
}

function login(name: string) {
  return async function (formData: FormData) {
    "use server";
    const provider = getProvider(name);
    const authorize = async () => {
      const response = await provider?.authorize(
        Object.entries(provider.credentials).reduce(
          (p, [name]) => merge(p, { [name]: formData.get(name) as string }),
          {} as {}
        )
      );
      if (response?.user) {
        const session = await lucia.createSession(response?.user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      }
      if (response?.cookie) {
        cookies().set(...response.cookie);
      }
      if (response?.redirect) {
        redirect(response.redirect);
      }
    };
    await authorize();
  };
}
