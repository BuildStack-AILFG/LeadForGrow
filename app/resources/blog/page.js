'use client';

import React, { useState } from 'react';
import UserNavbar from '../../user/Header';
import Footer from '../../components/Footer';
import { useTheme } from '../../components/ThemeContext';
import { Calendar, User, Clock, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

import { categories, blogPosts } from './blogData';

export default function BlogPage() {
    const { theme } = useTheme();
    const [activeCategory, setActiveCategory] = useState("All Categories");
    const [searchQuery, setSearchQuery] = useState("");
    const [visiblePosts, setVisiblePosts] = useState(6);

    const filteredPosts = blogPosts.filter(post => {
        const matchesCategory = activeCategory === "All Categories" || post.category === activeCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const displayedPosts = filteredPosts.slice(0, visiblePosts);

    return (
        <div className="min-h-screen bg-white dark:bg-black transition-colors duration-500 flex flex-col">
            <UserNavbar />

            {/* Hero Section - Zomato Style */}
            <div className="relative h-[400px] w-full mt-20 flex items-center justify-center overflow-hidden">
                {/* Hero Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2340&auto=format&fit=crop')`,
                    }}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-6xl md:text-9xl font-serif text-white tracking-tighter mb-6">
                        leadforgrow
                    </h1>

                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-8 py-24 w-full flex-grow">
                {/* Title & Underline */}
                <div className="mb-16">
                    <h2 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-4">
                        Our Stories
                    </h2>
                    <div className="h-1 w-24 bg-indigo-600 rounded-full"></div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setActiveCategory(category);
                                    setVisiblePosts(6); // Reset pagination on filter
                                }}
                                className={`px-6 py-3 rounded-2xl text-sm font-bold tracking-tight transition-all duration-300 border-2 ${activeCategory === category
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 -translate-y-0.5'
                                    : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setVisiblePosts(6); // Reset pagination on search
                            }}
                            className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-600 transition-all dark:text-white text-sm"
                        />
                    </div>
                </div>

                {/* Blog Post Grid */}
                {displayedPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {displayedPosts.map((post, idx) => (
                            <Link
                                href={`/resources/blog/${post.slug}`}
                                key={post.id}
                                className={`group flex flex-col bg-white dark:bg-slate-900/30 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.1)] transition-all duration-500 cursor-pointer`}
                            >
                                {/* Post Image Container */}
                                <div className="relative aspect-[16/11] overflow-hidden rounded-[2.5rem] m-3">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="absolute bottom-6 left-6">
                                        <span className="px-5 py-2 bg-white/90 dark:bg-black/90 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em] rounded-full text-indigo-600 dark:text-indigo-400 border border-white/50 dark:border-white/10 shadow-lg">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="px-8 pb-10 pt-4 flex-grow flex flex-col">
                                    {/* Metadata Row */}
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-6">
                                        <span className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-indigo-500" />
                                            {post.author}
                                        </span>
                                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                            {post.date}
                                        </span>
                                    </div>

                                    {/* Title & Excerpt */}
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-tight tracking-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-8 line-clamp-3 text-lg">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            {post.readTime}
                                        </span>
                                        <div className="relative flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest group/btn overflow-hidden">
                                            <span className="relative z-10 transition-transform duration-300 group-hover/btn:-translate-x-1">Read Story</span>
                                            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No articles found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                )}

                {/* Pagination / Load More */}
                {visiblePosts < filteredPosts.length && (
                    <div className="mt-20 text-center">
                        <button
                            onClick={() => setVisiblePosts(prev => prev + 6)}
                            className="px-10 py-4 bg-white dark:bg-black border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white hover:border-indigo-600 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            Load More Posts
                        </button>
                    </div>
                )}
            </div>

            {/* Newsletter Section */}
            <div className="bg-slate-950 py-24 relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>

                <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Get growing insights in your inbox
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-light">
                        Stay ahead with our bi-weekly strategy newsletter. No spam, just pure signal.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="flex-grow px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-white"
                        />
                        <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 active:scale-95">
                            Subscribe Now
                        </button>
                    </div>
                </div>
            </div>

            {/* <Footer /> */}
        </div >
    );
}
