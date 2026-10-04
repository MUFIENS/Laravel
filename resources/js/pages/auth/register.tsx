import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <AuthSplitLayout
            mode="register"
            badge="Pendaftaran Akun Siswa"
            title="Gabung ke KOPDIG"
            description="Mulai menjelajahi, berkarya, dan bertransaksi bersama warga sekolah."
            visualImage="/images/campaign/student-craft.jpg"
            visualTag="Kemitraan Siswa & Koperasi"
            visualHeadline="DARI KARYA SISWA HINGGA TRANSAKSI NYATA."
            visualSubtext="Daftar untuk mulai memesan kebutuhan sekolah, produk kantin sehat, atau mengajukan karya kreatifmu ke sistem kurasi koperasi."
            visualAnnotation="[ FIG. AUTH-02 — KURASI & KARYA SISWA ]"
            switchText="Sudah punya akun?"
            switchLinkText="Masuk ke Akun"
            switchLinkHref={login()}
        >
            <Head title="Gabung ke KOPDIG" />

            {/* Quiet info badge regarding Student role integrity */}
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-[#A3A3A3]">
                <ShieldCheck className="size-4 shrink-0 text-[#E34A27]" />
                <span className="leading-relaxed">
                    Pendaftaran publik otomatis terdaftar sebagai{' '}
                    <strong className="font-semibold text-[#F5F2EB]">
                        Akun Siswa
                    </strong>
                    .
                </span>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="name"
                                    className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase"
                                >
                                    Nama Lengkap
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    placeholder="Contoh: Budi Santoso"
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="email"
                                    className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase"
                                >
                                    Alamat Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    placeholder="nama@sekolah.sch.id"
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password"
                                    className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase"
                                >
                                    Kata Sandi
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    passwordrules={passwordRules}
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Password Confirmation */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase"
                                >
                                    Konfirmasi Kata Sandi
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    placeholder="Ulangi kata sandi"
                                    passwordrules={passwordRules}
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="group relative mt-3 h-11 w-full overflow-hidden rounded-md bg-[#E34A27] text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[#d03f1e] hover:shadow-lg hover:shadow-[#E34A27]/20 active:scale-[0.98] disabled:opacity-60"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Membuat Akun...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Daftar Akun Siswa</span>
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Mobile Switcher Action */}
                        <div className="mt-3 text-center text-xs text-[#737373] sm:hidden">
                            Sudah punya akun?{' '}
                            <Link
                                href={login()}
                                className="font-medium text-[#F5F2EB] underline-offset-4 transition-colors hover:text-[#E34A27] hover:underline"
                                tabIndex={6}
                            >
                                Masuk ke Akun
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </AuthSplitLayout>
    );
}

Register.layout = (page: React.ReactNode) => page;
