// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ksgenquvxmaftrlztlfg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZ2VucXV2eG1hZnRybHp0bGZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc5Nzg3NywiZXhwIjoyMDcyMzczODc3fQ.a8Gx9lCqK1wDiU-vIRIBvQBtSJwIpW1gCTFfKII6n_U'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database service functions
export const staffService = {
  // Get all staff members
  async getAllStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Add new staff member
  async addStaff(staffData) {
    const avatar = staffData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    
    const { data, error } = await supabase
      .from('staff')
      .insert([{ ...staffData, avatar }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Update staff member
  async updateStaff(id, updates) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete staff member
  async deleteStaff(id) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export const shiftsService = {
  // Get shifts for date range
  async getShifts(startDate, endDate) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')
    
    if (error) throw error
    return data
  },

  // Get shifts for specific date
  async getShiftsByDate(date) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar
        )
      `)
      .eq('date', date)
      .order('start_time')
    
    if (error) throw error
    return data
  },

  // Create new shift
  async createShift(shiftData) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar
        )
      `)
      .single();
    
    if (error) throw error
    return data[0]
  },

  // Update shift
  async updateShift(id, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar
        )
      `)
    
    if (error) throw error
    return data[0]
  },

  // Delete shift
  async deleteShift(id) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Delete shifts by staff and time range (for removing partial hours)
  async deleteShiftsByTimeRange(staffId, date, startTime, endTime) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('staff_id', staffId)
      .eq('date', date)
      .gte('start_time', startTime)
      .lte('end_time', endTime)
    
    if (error) throw error
  }
}

export const clockService = {
  // Get today's clock entries for staff
  async getTodaysClockEntries(date) {
    const { data, error } = await supabase
      .from('clock_entries')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          avatar
        )
      `)
      .eq('date', date)
    
    if (error) throw error
    return data
  },

  // Clock in/out
  async clockInOut(staffId, action, shiftId = null) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    if (action === 'in') {
      // Create new clock entry
      const { data, error } = await supabase
        .from('clock_entries')
        .insert([{
          staff_id: staffId,
          shift_id: shiftId,
          clock_in_time: now.toISOString(),
          date: today
        }])
        .select()
      
      if (error) throw error
      return data[0]
    } else {
      // Update existing clock entry with clock out
      const { data, error } = await supabase
        .from('clock_entries')
        .update({ clock_out_time: now.toISOString() })
        .eq('staff_id', staffId)
        .eq('date', today)
        .is('clock_out_time', null)
        .select()
      
      if (error) throw error
      return data[0]
    }
  },

  // Get current clock status for staff
  async getCurrentClockStatus(staffId, date) {
    const { data, error } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('staff_id', staffId)
      .eq('date', date)
      .is('clock_out_time', null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data[0] || null
  }
}

// Utility functions for data transformation
export const dataTransformers = {
  // Convert database shift to app format
  shiftToAppFormat(dbShift) {
    return {
      id: dbShift.id,
      staffId: dbShift.staff_id,
      date: dbShift.date,
      startTime: dbShift.start_time.substring(0, 5), // Remove seconds
      endTime: dbShift.end_time.substring(0, 5), // Remove seconds
      role: dbShift.role,
      staff: dbShift.staff
    }
  },

  // Convert app shift to database format
  appToShiftFormat(appShift) {
    return {
      staff_id: appShift.staffId,
      date: appShift.date,
      start_time: appShift.startTime,
      end_time: appShift.endTime,
      role: appShift.role
    }
  },

  // Convert database staff to app format
  staffToAppFormat(dbStaff) {
    return {
      id: dbStaff.id,
      name: dbStaff.name,
      email: dbStaff.email,
      role: dbStaff.role,
      avatar: dbStaff.avatar
    }
  }
}

// Real-time subscriptions (optional)
export const subscriptions = {
  // Subscribe to staff changes
  subscribeToStaff(callback) {
    return supabase
      .channel('staff-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staff'
      }, callback)
      .subscribe()
  },

  // Subscribe to shift changes
  subscribeToShifts(callback) {
    return supabase
      .channel('shifts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shifts'
      }, callback)
      .subscribe()
  },

  // Subscribe to clock entries changes
  subscribeToClockEntries(callback) {
    return supabase
      .channel('clock-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clock_entries'
      }, callback)
      .subscribe()
  }
}