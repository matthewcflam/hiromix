import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type {
  StickyNoteInsertInput,
  StickyNoteRecord,
  StickyNoteUpdateInput,
} from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export const STICKY_NOTES_TABLE = "sticky_notes";
export const DEFAULT_STICKY_NOTES_BOARD_ID = "global";

interface StickyNotesRow {
  id: string;
  board_id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface StickyNotesChannelHandlers {
  onInsert: (note: StickyNoteRecord) => void;
  onUpdate: (note: StickyNoteRecord) => void;
  onDelete: (noteId: string) => void;
  onStatusChange?: (status: string) => void;
}

const mapRowToStickyNoteRecord = (row: StickyNotesRow): StickyNoteRecord => ({
  id: row.id,
  boardId: row.board_id,
  text: row.text,
  color: row.color,
  x: row.x,
  y: row.y,
  rotation: row.rotation,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

const getRequiredSupabaseClient = () => {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
};

const toRealtimeRecord = (
  payload: RealtimePostgresChangesPayload<StickyNotesRow>
): StickyNoteRecord => mapRowToStickyNoteRecord(payload.new);

export const listStickyNotes = async (boardId: string): Promise<StickyNoteRecord[]> => {
  const client = getRequiredSupabaseClient();
  const { data, error } = await client
    .from(STICKY_NOTES_TABLE)
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as StickyNotesRow[]).map(mapRowToStickyNoteRecord);
};

export const createStickyNote = async (
  input: StickyNoteInsertInput
): Promise<StickyNoteRecord> => {
  const client = getRequiredSupabaseClient();
  const { data, error } = await client
    .from(STICKY_NOTES_TABLE)
    .insert({
      id: input.id,
      board_id: input.boardId,
      text: input.text,
      color: input.color,
      x: input.x,
      y: input.y,
      rotation: input.rotation,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRowToStickyNoteRecord(data as StickyNotesRow);
};

export const updateStickyNote = async (
  noteId: string,
  boardId: string,
  patch: StickyNoteUpdateInput
): Promise<StickyNoteRecord> => {
  const client = getRequiredSupabaseClient();
  const updateRow: Partial<StickyNotesRow> = {};

  if (patch.text !== undefined) updateRow.text = patch.text;
  if (patch.color !== undefined) updateRow.color = patch.color;
  if (patch.x !== undefined) updateRow.x = patch.x;
  if (patch.y !== undefined) updateRow.y = patch.y;
  if (patch.rotation !== undefined) updateRow.rotation = patch.rotation;

  const { data, error } = await client
    .from(STICKY_NOTES_TABLE)
    .update(updateRow)
    .eq("id", noteId)
    .eq("board_id", boardId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRowToStickyNoteRecord(data as StickyNotesRow);
};

export const deleteStickyNote = async (noteId: string, boardId: string): Promise<void> => {
  const client = getRequiredSupabaseClient();
  const { error } = await client
    .from(STICKY_NOTES_TABLE)
    .delete()
    .eq("id", noteId)
    .eq("board_id", boardId);

  if (error) {
    throw error;
  }
};

export const subscribeToStickyNotes = (
  boardId: string,
  handlers: StickyNotesChannelHandlers
): RealtimeChannel => {
  const client = getRequiredSupabaseClient();

  const channel = client.channel(`sticky-notes:${boardId}`);
  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: STICKY_NOTES_TABLE,
        filter: `board_id=eq.${boardId}`,
      },
      (payload: RealtimePostgresChangesPayload<StickyNotesRow>) => {
        handlers.onInsert(toRealtimeRecord(payload));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: STICKY_NOTES_TABLE,
        filter: `board_id=eq.${boardId}`,
      },
      (payload: RealtimePostgresChangesPayload<StickyNotesRow>) => {
        handlers.onUpdate(toRealtimeRecord(payload));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: STICKY_NOTES_TABLE,
        filter: `board_id=eq.${boardId}`,
      },
      (payload: RealtimePostgresChangesPayload<StickyNotesRow>) => {
        const noteId = payload.old.id;
        if (typeof noteId === "string" && noteId.length > 0) {
          handlers.onDelete(noteId);
        }
      }
    )
    .subscribe((status) => {
      handlers.onStatusChange?.(status);
    });

  return channel;
};

export const unsubscribeFromStickyNotes = async (channel: RealtimeChannel): Promise<void> => {
  const client = getRequiredSupabaseClient();
  await client.removeChannel(channel);
};
