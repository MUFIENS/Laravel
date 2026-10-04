import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <AuthSplitLayout
            mode="login"
            badge="Portal Masuk Resmi"
            title="Masuk ke KOPDIG"
            description="Masuk ke ruang niaga warga sekolah."
            visualImage="/images/campaign/community-counter.jpg"
            visualTag="Autentikasi Warga Sekolah"
            visualHeadline="RUANG NIAGA MANDIRI WARGA SEKOLAH."
            visualSubtext="Platform resmi koperasi sekolah untuk kurasi produk konsinyasi karya siswa, pemesanan digital cepat, dan pengambilan pesanan tanpa antrean tunai."
            visualAnnotation="[ FIG. AUTH-01 — LOKET & TRANSAKSI RESMI ]"
            switchText="Belum punya akun?"
            switchLinkText="Daftar sebagai Siswa"
            switchLinkHref={register()}
            status={status}
        >
            <Head title="Masuk ke KOPDIG" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-4">
                            {/* Email Address Field */}
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
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@sekolah.sch.id"
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase"
                                    >
                                        Kata Sandi
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs text-[#737373] transition-colors hover:text-[#E34A27]"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="h-11 border-[#262626] bg-[#141414] px-4 text-sm text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center space-x-2.5 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="size-4 rounded border-[#262626] bg-[#141414] focus-visible:border-[#E34A27] focus-visible:ring-1 focus-visible:ring-[#E34A27]/30 data-[state=checked]:border-[#E34A27] data-[state=checked]:bg-[#E34A27] data-[state=checked]:text-white"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-xs text-[#A3A3A3] select-none"
                                >
                                    Ingat saya di perangkat ini
                                </Label>
                            </div>

                            {/* Primary Submit Button */}
                            <Button
                                type="submit"
                                className="group relative mt-2 h-11 w-full overflow-hidden rounded-md bg-[#E34A27] text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[#d03f1e] hover:shadow-lg hover:shadow-[#E34A27]/20 active:scale-[0.98] disabled:opacity-60"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Memverifikasi...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Masuk ke Akun</span>
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Mobile Switcher Action */}
                        <div className="mt-3 text-center text-xs text-[#737373] sm:hidden">
                            Belum punya akun?{' '}
                            <Link
                                href={register()}
                                className="font-medium text-[#F5F2EB] underline-offset-4 transition-colors hover:text-[#E34A27] hover:underline"
                                tabIndex={6}
                            >
                                Daftar sebagai Siswa
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </AuthSplitLayout>
    );
}

Login.layout = (page: React.ReactNode) => page;
