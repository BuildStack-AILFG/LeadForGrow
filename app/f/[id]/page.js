"use client";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PublicFormPage() {
    const { id: token } = useParams();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');

    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (token) fetchForm();
    }, [token]);

    async function fetchForm() {
        try {
            const resp = await fetch(`/api/forms/public?token=${token}`);
            const data = await resp.json();
            if (data.success) {
                setForm(data.data);
                // Initialize form data
                const initial = {};
                data.data.fields.forEach(f => initial[f.name] = '');
                setFormData(initial);
            } else {
                setError(data.error || 'Form not found');
            }
        } catch (e) {
            setError('Failed to load form');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                token: form.token,
                eventId: eventId || undefined
            };

            const resp = await fetch('/api/forms/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            if (data.success) {
                setSubmitted(true);
                if (form.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = form.redirectUrl;
                    }, 2000);
                }
            } else {
                toast.error(data.error || 'Submission failed');
            }
        } catch (err) {
            toast.error('Error submitting form');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Form Unavailable</h1>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-indigo-600 font-bold">Try again</button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-4">Submission Successful!</h1>
                    <p className="text-slate-500 leading-relaxed">
                        {form.successMessage || 'Thank you! Your information has been received and we will be in touch shortly.'}
                    </p>
                    {form.redirectUrl && (
                        <p className="text-xs text-slate-400 mt-8 animate-pulse">Redirecting you now...</p>
                    )}
                </div>
            </div>
        );
    }

    const themeClass = form.styling?.theme === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200';
    const inputClass = form.styling?.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 md:p-8">
            <div className={`${themeClass} w-full max-w-lg rounded-[32px] border shadow-2xl overflow-hidden p-8 md:p-12 animate-in slide-in-from-bottom duration-500`}>
                <div className="mb-10">
                    <h1 className="text-3xl font-black mb-2">{form.name}</h1>
                    <p className="opacity-60 text-sm">{form.description || 'Please fill out the form below.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {form.fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2 ml-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    required={field.required}
                                    value={formData[field.name]}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className={`w-full ${inputClass} rounded-2xl p-4 outline-none focus:ring-2 transition-all min-h-[120px] resize-none border-2 border-transparent`}
                                    style={{ '--tw-ring-color': form.styling?.primaryColor || '#4f46e5' }}
                                    placeholder={field.placeholder}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    required={field.required}
                                    value={formData[field.name]}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className={`w-full ${inputClass} rounded-2xl p-4 outline-none focus:ring-2 transition-all border-2 border-transparent`}
                                    style={{ '--tw-ring-color': form.styling?.primaryColor || '#4f46e5' }}
                                >
                                    <option value="">Select an option</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input
                                    required={field.required}
                                    type={field.type}
                                    value={formData[field.name]}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className={`w-full ${inputClass} rounded-2xl p-4 outline-none focus:ring-2 transition-all border-2 border-transparent`}
                                    style={{ '--tw-ring-color': form.styling?.primaryColor || '#4f46e5' }}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                        style={{ backgroundColor: form.styling?.primaryColor || '#4f46e5', boxShadow: `0 20px 40px -10px ${form.styling?.primaryColor}40` }}
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (form.styling?.buttonText || 'Submit')}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-current opacity-10 flex items-center justify-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-black text-white">L</div>
                    <span className="text-[10px] font-bold tracking-tighter uppercase grayscale">Powered by LeadForGrow</span>
                </div>
            </div>
        </div>
    );
}
