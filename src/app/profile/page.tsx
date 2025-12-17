'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit2, Save, X } from 'lucide-react';

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: 'Admin Staff',
        email: 'admin@billiard.com',
        phone: '+62 812-3456-7890',
        role: 'Administrator',
        joinDate: '2024-01-15'
    });

    const handleSave = () => {
        // TODO: Save to API
        setIsEditing(false);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[#050a07]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                    <p className="text-slate-400">Manage your account information</p>
                </div>

                {/* Profile Card */}
                <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl overflow-hidden">
                    {/* Cover & Avatar */}
                    <div className="h-32 bg-gradient-to-r from-[#22c55e]/20 to-[#16a34a]/20 relative">
                        <div className="absolute -bottom-16 left-8">
                            <div
                                className="w-32 h-32 rounded-full border-4 border-[#0f1a14] bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDSXEwEBAG2NAPXBI83UjWeu9u1BDtuzfF4yVgsN5WQpTMsVVZE24sxesTJzVeY3buzorogyyDq6FCbFmjtOXwj-e8alujnNmVnTNFSHLYgum6OMhZUcVUxZIs86OC3NInm0W4cv-3gGo22Esm1gT9UNbUqbr2J05G8T86iSw7_G4brvFWfxtTBJU5RLMDKXqZWQSZgajGUqpuuxsrx5HbSEMMx0nKtmBHUb32ZSe3bEHZyX1Pdbyv7m22TEnCokFBjVHwjSNHoEas")' }}
                            />
                        </div>
                    </div>

                    {/* Edit Button */}
                    <div className="flex justify-end p-6 pt-4">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#16261d] hover:bg-[#1e3328] text-white rounded-lg border border-[#1e3328] transition-colors"
                            >
                                <Edit2 size={16} />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#16261d] hover:bg-[#1e3328] text-slate-300 rounded-lg border border-[#1e3328] transition-colors"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-medium rounded-lg transition-colors"
                                >
                                    <Save size={16} />
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="px-8 pb-8 pt-12 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <User size={16} />
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded-lg px-4 py-2 text-white focus:border-[#22c55e] outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium text-white">{formData.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Mail size={16} />
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded-lg px-4 py-2 text-white focus:border-[#22c55e] outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium text-white">{formData.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Phone size={16} />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded-lg px-4 py-2 text-white focus:border-[#22c55e] outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium text-white">{formData.phone}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Role */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                    <Shield size={16} />
                                    Role
                                </label>
                                <div className="px-3 py-2 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg">
                                    <p className="text-[#22c55e] font-medium">{formData.role}</p>
                                </div>
                            </div>

                            {/* Join Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                    <Calendar size={16} />
                                    Member Since
                                </label>
                                <p className="text-white font-medium px-3 py-2">{new Date(formData.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Settings */}
                <div className="mt-6 bg-[#0f1a14] border border-[#1e3328] rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Account Settings</h2>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-[#16261d] hover:bg-[#1e3328] rounded-lg border border-[#1e3328] transition-colors">
                            <p className="text-white font-medium">Change Password</p>
                            <p className="text-xs text-slate-400">Update your password regularly for security</p>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-[#16261d] hover:bg-[#1e3328] rounded-lg border border-[#1e3328] transition-colors">
                            <p className="text-white font-medium">Notification Preferences</p>
                            <p className="text-xs text-slate-400">Manage how you receive updates</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
