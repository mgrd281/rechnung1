import { ProfileForm } from '@/components/real-estate/profile-form'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProfilePage({ params }: { params: { id: string } }) {
    const profile = await prisma.realEstateSearchProfile.findUnique({
        where: { id: params.id }
    })

    if (!profile) notFound()

    return <ProfileForm initialData={profile} isEdit />
}
