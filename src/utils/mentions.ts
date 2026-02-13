import { supabase } from './supabase/client'

export interface MentionUser {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export async function fetchMentionSuggestions(query: string): Promise<MentionUser[]> {
    if (!query) {
        // Return some popular/recent users if no query
        const { data } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .limit(5)
        return data || []
    }

    const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8)

    return data || []
}
