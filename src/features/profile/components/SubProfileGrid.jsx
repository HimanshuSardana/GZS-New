import { Link } from 'react-router-dom';
import { FiPlus, FiLock } from 'react-icons/fi';
import SubProfileCard from './SubProfileCard';
import { MOCK_SKILLS } from '@/shared/data/profileData';

export default function SubProfileGrid({ subProfiles = [], isOwn = false, username, isConnected = false }) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {subProfiles.map((subProfile) => {
          const isLocked = subProfile.visibility === 'connections-only' && !isConnected;
          
          return (
            <div key={subProfile.id} className="relative">
              <SubProfileCard
                subProfile={subProfile}
                isOwn={isOwn}
                username={username}
                skills={MOCK_SKILLS.filter((skill) => skill.sub_profile_id === subProfile.id)}
                isLocked={isLocked}
              />
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <FiLock size={20} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">Connect to view</p>
                  <p className="mt-1 text-xs text-slate-500">This profile is only visible to connections</p>
                </div>
              )}
            </div>
          );
        })}

        {isOwn ? (
          <Link
            to="/profile/create-sub"
            className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 text-center shadow-sm transition hover:border-violet-300 hover:text-violet-700"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <FiPlus size={22} />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">Add Domain Profile</p>
            <p className="mt-2 text-sm text-slate-500">Create a new identity for another part of your gaming journey.</p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
