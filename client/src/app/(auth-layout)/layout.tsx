import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <style>{`
				* { box-sizing: border-box; }
				body { margin: 0; }
				.auth-shell {
					min-height: 100svh;
					display: grid;
					place-items: center;
					padding: 28px;
					color: #252521;
					background: #f1f0e9;
					font-family: var(--font-geist-sans), sans-serif;
				}
				.auth-frame {
					display: grid;
					grid-template-columns: minmax(420px, 0.94fr) minmax(420px, 1.06fr);
					width: min(1200px, 100%);
					min-height: min(760px, calc(100svh - 56px));
					overflow: hidden;
					background: #fffefa;
					border: 1px solid #e5e3d9;
					border-radius: 10px;
					box-shadow: 0 24px 70px rgb(47 46 36 / 10%);
				}
				.auth-form-panel {
					display: flex;
					flex-direction: column;
					padding: 38px clamp(34px, 5vw, 70px) 34px;
				}
				.auth-topbar, .auth-brand, .auth-signin, .auth-banner-kicker,
				.auth-banner-footer, .auth-banner-dots, .auth-submit-label {
					display: flex;
					align-items: center;
				}
				.auth-topbar { justify-content: space-between; gap: 16px; }
				.auth-brand { gap: 10px; color: #292a23; text-decoration: none; }
				.auth-brand-mark {
					position: relative;
					display: grid;
					width: 34px;
					height: 34px;
					place-items: center;
					overflow: hidden;
					border-radius: 9px;
					background: #d5e664;
					transform: rotate(-7deg);
				}
				.auth-brand-mark::before, .auth-brand-mark::after {
					position: absolute;
					width: 17px;
					height: 17px;
					content: "";
					border: 2px solid #303329;
					border-radius: 50%;
				}
				.auth-brand-mark::after { transform: translate(7px, 6px); }
				.auth-brand-name { font-size: 16px; font-weight: 750; letter-spacing: 0; }
				.auth-signin { gap: 5px; color: #77786e; font-size: 12px; white-space: nowrap; }
				.auth-signin a { color: #34372b; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
				.auth-form-content { width: min(100%, 390px); margin: auto; padding: 48px 0; }
				.auth-eyebrow {
					display: inline-flex;
					align-items: center;
					gap: 8px;
					margin-bottom: 20px;
					color: #75776a;
					font-size: 11px;
					font-weight: 700;
					letter-spacing: 1.2px;
					text-transform: uppercase;
				}
				.auth-eyebrow::before { width: 20px; height: 2px; content: ""; background: #b2c93a; }
				.auth-title { margin: 0; color: #292a23; font-size: 36px; font-weight: 650; letter-spacing: 0; line-height: 1.12; }
				.auth-description { margin: 12px 0 30px; color: #77786e; font-size: 14px; line-height: 1.65; }
				.auth-form { display: flex; flex-direction: column; gap: 19px; }
				.auth-field { display: flex; flex-direction: column; gap: 8px; }
				.auth-field [data-slot="label"] { color: #3d3e36; font-size: 12px; font-weight: 650; }
				.auth-field [data-slot="input"] {
					width: 100%;
					height: 48px;
					padding: 0 14px;
					color: #2d2e28;
					border: 1px solid #deded5;
					border-radius: 6px;
					outline: none;
					background: #fff;
					font-family: inherit;
					font-size: 13px;
					transition: border-color 160ms ease, box-shadow 160ms ease;
				}
				.auth-field [data-slot="input"]::placeholder { color: #aaa99e; }
				.auth-field [data-slot="input"]:focus { border-color: #899b35; box-shadow: 0 0 0 3px rgb(181 202 71 / 20%); }
				.auth-submit {
					display: flex;
					align-items: center;
					width: 100%;
					height: 49px;
					justify-content: space-between;
					margin-top: 3px;
					padding: 0 16px;
					color: #24251f;
					border: 0;
					border-radius: 6px;
					background: #d5e664;
					font-family: inherit;
					font-size: 13px;
					font-weight: 700;
					cursor: pointer;
					transition: background 160ms ease, transform 160ms ease;
				}
				.auth-submit:hover { background: #c9dc4e; transform: translateY(-1px); }
				.auth-submit:focus-visible { outline: 3px solid rgb(137 155 53 / 40%); outline-offset: 3px; }
				.auth-submit-label { gap: 8px; }
				.auth-terms { margin: 20px 0 0; color: #8b8b81; font-size: 11px; line-height: 1.65; }
				.auth-terms a { color: #4d5239; text-decoration: underline; text-underline-offset: 2px; }
				.auth-bottom-note { margin: 0; color: #aaa99e; font-size: 10px; }
				.auth-banner {
					position: relative;
					display: flex;
					min-height: 100%;
					flex-direction: column;
					justify-content: space-between;
					overflow: hidden;
					padding: 36px;
					color: #fff;
					background-color: #555741;
					background-image: linear-gradient(180deg, rgb(22 24 19 / 18%) 0%, rgb(22 24 19 / 5%) 38%, rgb(22 24 19 / 74%) 100%), url("https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85");
					background-position: center;
					background-size: cover;
				}
				.auth-banner-kicker { gap: 9px; align-self: flex-start; padding: 9px 12px; border: 1px solid rgb(255 255 255 / 34%); border-radius: 999px; background: rgb(28 29 23 / 22%); backdrop-filter: blur(8px); font-size: 10px; font-weight: 650; letter-spacing: 0.3px; }
				.auth-banner-kicker span { width: 6px; height: 6px; border-radius: 50%; background: #d5e664; }
				.auth-banner-copy { max-width: 410px; padding-top: 100px; }
				.auth-banner-index { margin: 0 0 15px; color: #e0e98d; font-size: 10px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; }
				.auth-banner-title { max-width: 390px; margin: 0; font-size: 40px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
				.auth-banner-text { max-width: 340px; margin: 16px 0 0; color: rgb(255 255 255 / 82%); font-size: 13px; line-height: 1.65; }
				.auth-banner-footer { justify-content: space-between; gap: 20px; margin-top: 44px; padding-top: 20px; border-top: 1px solid rgb(255 255 255 / 32%); }
				.auth-banner-caption { margin: 0; color: rgb(255 255 255 / 82%); font-size: 10px; }
				.auth-banner-dots { gap: 6px; }
				.auth-banner-dots span { width: 5px; height: 5px; border-radius: 50%; background: rgb(255 255 255 / 55%); }
				.auth-banner-dots span:first-child { width: 19px; border-radius: 8px; background: #d5e664; }
				@media (max-width: 900px) {
					.auth-shell { padding: 18px; }
					.auth-frame { grid-template-columns: minmax(340px, 1fr) minmax(300px, 0.9fr); min-height: calc(100svh - 36px); }
					.auth-form-panel { padding-right: 34px; padding-left: 34px; }
					.auth-banner { padding: 28px; }
					.auth-banner-title { font-size: 34px; }
				}
				@media (max-width: 700px) {
					.auth-shell { display: block; padding: 0; background: #fffefa; }
					.auth-frame { display: flex; width: 100%; min-height: 100svh; flex-direction: column; border: 0; border-radius: 0; box-shadow: none; }
					.auth-form-panel { min-height: 690px; padding: 24px 25px 20px; }
					.auth-form-content { padding: 54px 0; }
					.auth-banner { min-height: 390px; padding: 25px; }
					.auth-banner-copy { padding-top: 55px; }
					.auth-banner-title { font-size: 34px; }
				}
				@media (max-width: 390px) {
					.auth-form-panel { padding-right: 18px; padding-left: 18px; }
					.auth-signin { gap: 4px; font-size: 11px; }
					.auth-title { font-size: 32px; }
				}
			`}</style>
      {children}
    </main>
  );
}
