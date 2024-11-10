"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function useClientGetData(
    table: string,
    query: string,
    options?: {
        single?: boolean;
        form?: boolean;
        con?: { key; value? };
    }
) {
    const [data, setData] = useState<any>([]);

    const fetchData = async () => {
        const supabase = createClientComponentClient();
        let request = supabase.from(table).select(query);

        if (options.con) {
            if (options.con.value) {
                request = request.eq(options.con.key, options.con.value);
            } else {
                const {
                    data: { user: user },
                } = await supabase.auth.getUser();
                request = request.eq(options.con.key, user.id);
            }
        }

        const { data: tableData, error } = await request;

        if (error) {
            console.error(error);
            return null;
        }

        setData(options.single ? tableData?.[0] : tableData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return [data, setData];
}
