"use client";

import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import CalendarPanel from '@/components/admin/CalendarPanel';
import LogsPanel from '@/components/admin/LogsPanel';
import CSVImportScores from '@/components/admin/CSVImportScores';
import CSVImportUsers from '@/components/admin/CSVImportUsers';
import AdminGuideModal from '@/components/admin/AdminGuideModal';
import DashboardPanel from '@/components/admin/DashboardPanel';

type TabType = 'dashboard' | 'scores' | 'categories' | 'roles' | 'sections' | 'personal' | 'calendar' | 'logs' | 'requests';
const DEFAULT_FAMILIAS = ["Cuerda", "Viento Madera", "Viento Metal", "Teclados", "Percusión", "Coro", "Tuttis", "Generales", "Otros"];

export default function AdminOCGCPartituras() {
  const { user, isLoaded } = useUser();
  const [tagsDict, setTagsDict] = useState<Record<string, any[]>>({});
  const [newTagFamily, setNewTagFamily] = useState('Otros');
  const [predefinedTags, setPredefinedTags] = useState<string[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [agrupaciones, setAgrupaciones] = useState<any[]>([]);
  const [papeles, setPapeles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAgrupaciones, setSelectedAgrupaciones] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType | null>('dashboard');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; eventDate?: string | null } | null>(null);
  const [editingScore, setEditingScore] = useState<any | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingMemberData, setEditingMemberData] = useState<any | null>(null);
  const [selectedMemberTags, setSelectedMemberTags] = useState<string[]>([]);
  
  // Estados para invitaciones
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteSurname, setInviteSurname] = useState('');
  const [inviteSection, setInviteSection] = useState('');
  const [inviteAgrupacion, setInviteAgrupacion] = useState('');
  const [inviteSection2, setInviteSection2] = useState('');
  const [inviteAgrupacion2, setInviteAgrupacion2] = useState('');
  const [inviteSection3, setInviteSection3] = useState('');
  const [inviteAgrupacion3, setInviteAgrupacion3] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  
  // Estados para solicitudes de unión
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isJoinRequestsLoaded, setIsJoinRequestsLoaded] = useState(false);
  const [filterRequestStatus, setFilterRequestStatus] = useState<string>('Pendiente');

  // Estado para el último link generado
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  // Estado para creación manual de usuarios
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualUser, setManualUser] = useState({
    firstName: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    dni: '',
    phone: '',
    matricula: '',
    isMaster: false,
    isArchiver: false,
    isExternal: false,
    artisticProfiles: [{ agrupacion: '', seccion: '', papel: 'Músico' }]
  });

  // Estados para promover usuario de DB a Clerk (Acceso Plataforma)
  const [upgradingMember, setUpgradingMember] = useState<any | null>(null);
  const [upgradeData, setUpgradeData] = useState({ email: '', username: '', password: '' });
  const [isUpgrading, setIsUpgrading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Enlace copiado al portapapeles! 📋");
  };

  // Estados para vista previa de subida
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsDoc, setUploadIsDoc] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Filtros de búsqueda y selectores
  const [searchScore, setSearchScore] = useState('');
  const [filterScoreCategory, setFilterScoreCategory] = useState<string>('all');
  const [filterScoreType, setFilterScoreType] = useState<string>('all');
  const [filterScoreInstrument, setFilterScoreInstrument] = useState<string>('all');

  const [searchCategory, setSearchCategory] = useState('');
  
  const [searchRole, setSearchRole] = useState('');
  
  const [searchMember, setSearchMember] = useState('');
  const [filterPersonalRole, setFilterPersonalRole] = useState<string>('all');
  const [filterPersonalInstrument, setFilterPersonalInstrument] = useState<string>('all');
  const [secciones, setSecciones] = useState<any[]>([]);

  const isMaster = !!user?.publicMetadata?.isMaster;
  const isArchiver = !!user?.publicMetadata?.isArchiver;

  const [newSectionName, setNewSectionName] = useState('');
  const [newAgrupacionName, setNewAgrupacionName] = useState('');
  const [newPapelName, setNewPapelName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isCreatingAgrupacion, setIsCreatingAgrupacion] = useState(false);
  const [isCreatingPapel, setIsCreatingPapel] = useState(false);

  const createSection = async () => {
    if (!newSectionName.trim()) return;
    setIsCreatingSection(true);
    try {
      const res = await fetch("/api/secciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seccion: newSectionName })
      });
      if (res.ok) {
        setNewSectionName('');
        loadData(true);
      }
    } catch (error) {
      console.error("Error creating section:", error);
    } finally {
      setIsCreatingSection(false);
    }
  };

  const deleteSection = async (id: number) => {
    if (!confirm("¿Eliminar esta sección artística?")) return;
    try {
      const res = await fetch(`/api/secciones?id=${id}`, { method: "DELETE" });
      if (res.ok) loadData(true);
    } catch (error) { console.error("Error deleting section:", error); }
  };

  const createAgrupacion = async () => {
    if (!newAgrupacionName.trim()) return;
    setIsCreatingAgrupacion(true);
    try {
      const res = await fetch("/api/agrupaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAgrupacionName })
      });
      if (res.ok) { setNewAgrupacionName(''); loadData(true); }
    } catch (error) { console.error("Error creating agrupacion:", error); }
    finally { setIsCreatingAgrupacion(false); }
  };

  const deleteAgrupacion = async (id: number) => {
    if (!confirm("¿Eliminar esta agrupación?")) return;
    try {
      const res = await fetch(`/api/agrupaciones?id=${id}`, { method: "DELETE" });
      if (res.ok) loadData(true);
    } catch (error) { console.error("Error deleting agrupacion:", error); }
  };

  const createPapel = async () => {
    if (!newPapelName.trim()) return;
    setIsCreatingPapel(true);
    try {
      const res = await fetch("/api/papeles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPapelName })
      });
      if (res.ok) { setNewPapelName(''); loadData(true); }
    } catch (error) { console.error("Error creating papel:", error); }
    finally { setIsCreatingPapel(false); }
  };

  const deletePapel = async (id: number) => {
    if (!confirm("¿Eliminar este papel artístico?")) return;
    try {
      const res = await fetch(`/api/papeles?id=${id}`, { method: "DELETE" });
      if (res.ok) loadData(true);
    } catch (error) { console.error("Error deleting papel:", error); }
  };

  const upgradeToPlatform = async () => {
    if (!upgradeData.email || !upgradeData.username || !upgradeData.password) {
      alert("Por favor, rellena Email, Usuario y Contraseña para activar el acceso.");
      return;
    }
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/admin/users/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbId: upgradingMember.dbId,
          ...upgradeData,
          targetRole: upgradingMember.targetRole,
          targetValue: upgradingMember.targetValue
        })
      });
      
      if (res.ok) {
        alert(`¡Acceso activado con éxito! El usuario ahora tiene cuenta en la plataforma.`);
        setUpgradingMember(null);
        setUpgradeData({ email: '', username: '', password: '' });
        loadMembers(true); // Recargar lista para ver el nuevo ID de Clerk
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "No se pudo activar el acceso"}`);
      }
    } catch (error) {
      console.error("Error upgrading user:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const loadData = async (force = false) => {
    if (dataLoaded && !force) return;
    try {
      const [tagsRes, scoresRes, categoriesRes, agrupsRes, papelesRes, seccionesRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/scores"),
        fetch("/api/categories"),
        fetch("/api/agrupaciones"),
        fetch("/api/papeles"),
        fetch("/api/secciones")
      ]);
      const [tagsData, scoresData, categoriesData, agrupsData, papelesData, seccionesData] = await Promise.all([
        tagsRes.ok ? tagsRes.json() : {},
        scoresRes.ok ? scoresRes.json() : [],
        categoriesRes.ok ? categoriesRes.json() : [],
        agrupsRes.ok ? agrupsRes.json() : [],
        papelesRes.ok ? papelesRes.json() : [],
        seccionesRes.ok ? seccionesRes.json() : []
      ]);
      setTagsDict(tagsData);
      setPredefinedTags(Object.values(tagsData).flat().map((i: any) => i.name));
      setScores(scoresData);
      setCategories(categoriesData);
      setAgrupaciones(agrupsData);
      setPapeles(papelesData);
      setSecciones(seccionesData);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadMembers = async (force = false) => {
    if (!isMaster || (membersLoaded && !force)) return;
    try {
      const [mRes, iRes, jrRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/invitations"),
        fetch("/api/admin/join-requests")
      ]);
      if (mRes.ok) setMembers(await mRes.json());
      if (iRes.ok) setInvitations(await iRes.json());
      if (jrRes.ok) setJoinRequests(await jrRes.json());
      setMembersLoaded(true);
      setIsJoinRequestsLoaded(true);
    } catch (error) {
      console.error("Error loading members/invitations/requests:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      if (!isMaster && !isArchiver) {
        window.location.href = "/miembros/tablon";
      } else if (activeTab === null) {
        setActiveTab(isMaster ? 'dashboard' : 'scores');
      }
    }
  }, [isLoaded, isMaster, isArchiver, user, activeTab]);

  useEffect(() => {
    if (activeTab === 'scores' || activeTab === 'categories' || activeTab === 'roles' || activeTab === 'personal' || activeTab === 'sections') {
      loadData();
    }
    
    if (activeTab === 'personal' || activeTab === 'requests') {
      loadMembers(true);
    }
  }, [activeTab]);

  // Mantener el modal de edición sincronizado con la lista maestra (para cambios en cascada)
  useEffect(() => {
    if (editingMemberData) {
      const updated = members.find(m => m.id === editingMemberData.id);
      if (updated) {
        // Solo actualizamos si hay cambios reales para evitar bucles de renderizado
        if (JSON.stringify(updated) !== JSON.stringify(editingMemberData)) {
          setEditingMemberData(updated);
        }
      }
    }
  }, [members]);

  const toggleTag = (r: string) => {
    setSelectedTags(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const toggleAgrupacion = (a: string) => {
    setSelectedAgrupaciones(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const deleteScore = async (id: number) => {
    if (!confirm("¿Eliminar esta partitura?")) return;
    try {
      await fetch(`/api/scores/${id}`, { method: "DELETE" });
      setScores(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting score:", error);
    }
  };

  const createTag = async () => {
    if (!newTagName) return;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, familia: newTagFamily })
      });
      if (res.ok) {
        setNewTagName('');
        loadData(true);
      } else {
        alert("Error al crear la etiqueta");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const deleteTag = async (id: number) => {
    if (!confirm("¿Eliminar esta etiqueta? Los músicos que la tengan asignada dejarán de ver las partituras asociadas.")) return;
    try {
      const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData(true);
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const updateScore = async () => {
    if (!editingScore?.title) return;
    try {
      const res = await fetch(`/api/scores/${editingScore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editingScore.title,
          categoryId: editingScore.categoryId || null,
          allowedRoles: editingScore.allowedRoles || [],
          allowedAgrupaciones: editingScore.allowedAgrupaciones || [],
          isDocument: editingScore.isDocument || false 
        })
      });
      const updated = await res.json();
      setScores(prev => prev.map(s => s.id === editingScore.id ? updated : s));
      setEditingScore(null);
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           name: editingCategory.name,
           eventDate: editingCategory.eventDate || null
        })
      });
      const updated = await res.json();
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, eventDate: newEventDate ? newEventDate : null })
      });
      const created = await res.json();
      setCategories(prev => [...prev, created]);
      setNewCategoryName('');
      setNewEventDate('');
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const toggleArchiverStatus = async (userId: string, isCurrentlyArchiver: boolean) => {
    // Si es un usuario de DB sin Clerk, forzamos creación de cuenta antes de dar permisos
    if (userId.startsWith('ext_')) {
      const dbMember = members.find(m => m.id === userId);
      setUpgradingMember({ ...dbMember, targetRole: 'archiver', targetValue: !isCurrentlyArchiver });
      setUpgradeData({ ...upgradeData, email: dbMember.email !== '—' ? dbMember.email : '' });
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "toggle-archiver",
          isArchiver: !isCurrentlyArchiver
        })
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => 
          m.id === userId ? { ...m, isArchiver: !isCurrentlyArchiver } : m
        ));
      }
    } catch (error) {
      console.error("Error toggling archiver status:", error);
    }
  };

  const updateMemberRoles = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "update-roles",
          roles: selectedMemberTags
        })
      });
      
      if (res.ok) {
        // Actualización dinámica local
        setMembers(prev => prev.map(m => 
          m.id === userId ? { ...m, roles: selectedMemberTags } : m
        ));
      }
    } catch (error) {
      console.error("Error updating member roles:", error);
    }
  };

  const updateEstructura = async (userId: string, estId: number, data: { activo?: boolean, atril?: string | number }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          estructuraId: estId,
          action: "update-estructura",
          ...data
        })
      });
      
      if (res.ok) {
        // Al cambiar estructura, recargamos personal porque puede haber cambiado el estado del perfil
        loadMembers(true);
        // Si estamos en medio de una edición, esto refrescará los datos del modal también al recargar los integrantes
      }
    } catch (error) {
      console.error("Error updating estructura:", error);
    }
  };

  const toggleMasterStatus = async (userId: string, isCurrentlyMaster: boolean) => {
    // Si es un usuario de DB sin Clerk, forzamos creación de cuenta antes de dar permisos
    if (userId.startsWith('ext_')) {
      const dbMember = members.find(m => m.id === userId);
      setUpgradingMember({ ...dbMember, targetRole: 'master', targetValue: !isCurrentlyMaster });
      setUpgradeData({ ...upgradeData, email: dbMember.email !== '—' ? dbMember.email : '' });
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "toggle-master",
          isMaster: !isCurrentlyMaster
        })
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => 
          m.id === userId ? { ...m, isMaster: !isCurrentlyMaster } : m
        ));
      }
    } catch (error) {
      console.error("Error toggling master status:", error);
    }
  };

  const toggleBanStatus = async (userId: string, isBanned: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "toggle-ban",
          isBanned: !isBanned
        })
      });
      if (res.ok) {
        loadMembers(true); // Recargar todo para ver cambios en estructuras vinculadas
      }
    } catch (error) {
      console.error("Error toggling ban status:", error);
    }
  };

  const createInvitation = async (sendEmail: boolean = false) => {
    if (!inviteName || !inviteSection) {
      alert("Por favor, pon el nombre y la sección del invitado.");
      return;
    }
    setIsGeneratingInvite(true);
    setLastGeneratedLink(null);
    try {
      const res = await fetch("/api/admin/invitations", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: inviteName || null,
          email: inviteEmail || null,
          phone: invitePhone || null,
          surname: inviteSurname || null,
          agrupacion: inviteAgrupacion || null,
          seccion: inviteSection || null,
          agrupacion2: inviteAgrupacion2 || null,
          seccion2: inviteSection2 || null,
          agrupacion3: inviteAgrupacion3 || null,
          seccion3: inviteSection3 || null,
          sendEmail
        })
      });
      if (res.ok) {
        const newInvite = await res.json();
        setInvitations(prev => [newInvite, ...prev]);
        const fullUrl = `${window.location.origin}/registro-usuarios?code=${newInvite.code}`;
        
        if (sendEmail && inviteEmail) {
          alert(`¡Invitación enviada por correo a ${inviteEmail}!`);
        } else {
          setLastGeneratedLink(fullUrl);
          // Opcional: copiar automáticamente
          navigator.clipboard.writeText(fullUrl);
          alert("✓ Enlace generado y copiado al portapapeles.");
        }
        setInviteName('');
        setInviteSurname('');
        setInviteSection('');
        setInviteAgrupacion('');
        setInviteSection2('');
        setInviteAgrupacion2('');
        setInviteSection3('');
        setInviteAgrupacion3('');
        setInviteEmail('');
        setInvitePhone('');
      }

    } catch (error) {
      console.error("Error creating invitation:", error);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const deleteInvitation = async (id: number) => {
    if (!confirm("¿Revocar esta invitación?")) return;
    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, { method: "DELETE" });
      if (res.ok) setInvitations(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error("Error deleting invitation:", error);
    }
  };

  const updateJoinRequestStatus = async (id: number, status: string, name?: string, surname?: string, email?: string) => {
    try {
      const res = await fetch("/api/admin/join-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setJoinRequests(prev => prev.map(jr => jr.id === id ? { ...jr, status } : jr));
        if (status === 'Aceptada' && name) {
          setInviteName(name);
          setInviteSurname(surname || '');
          setInviteEmail(email || '');
          // Buscamos la solicitud original para sacar los datos artísticos
          const req = joinRequests.find(jr => jr.id === id);
          if (req) {
            setInvitePhone(req.phone || '');
            setInviteAgrupacion(req.group || '');
            setInviteSection(req.instrument || '');
          }
          setActiveTab('personal');
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
          alert(`Solicitud de ${name} ${surname || ""} aceptada. Se han precargado sus datos. Pulsa el botón correpondiente abajo para finalizar.`);
        }
      }
    } catch (err) { console.error("Error updating status:", err); }
  };

  const deleteJoinRequest = async (id: number) => {
    if (!confirm("¿Eliminar esta solicitud por completo?")) return;
    try {
      const res = await fetch(`/api/admin/join-requests?id=${id}`, { method: "DELETE" });
      if (res.ok) setJoinRequests(prev => prev.filter(jr => jr.id !== id));
    } catch (err) { console.error("Error deleting request:", err); }
  };

  const createManualUser = async () => {
    const { firstName, email, username, password, dni, isExternal } = manualUser;
    if (!firstName || !dni) {
      alert("Por favor, rellena al menos el Nombre y el DNI (*)");
      return;
    }
    if (!isExternal && (!email || !username || !password)) {
      alert("Para usuarios con acceso (No Externos), el Email, Usuario y Contraseña son obligatorios.");
      return;
    }
    setIsCreatingManual(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualUser,
          artisticProfiles: manualUser.artisticProfiles.filter(p => p.agrupacion && p.seccion)
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("¡Usuario creado con éxito!");
        setIsManualCreateOpen(false);
        setManualUser({
          firstName: '', surname: '', email: '', username: '', password: '', dni: '', phone: '', matricula: '',
          isMaster: false, isArchiver: false, isExternal: false,
          artisticProfiles: [{ agrupacion: '', seccion: '', papel: 'Músico' }]
        });
        loadMembers(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error creating manual user:", error);
      alert("Error al conectar con el servidor.");
    } finally {
      setIsCreatingManual(false);
    }
  };

  if (!isLoaded) return <p>Cargando panel de gestión...</p>;

  const filteredScores = scores.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchScore.toLowerCase());
    const matchType = filterScoreType === 'all' || (filterScoreType === 'document' ? s.isDocument : !s.isDocument);
    const matchCategory = filterScoreCategory === 'all' || s.categoryId?.toString() === filterScoreCategory;
    
    // Check if score is for the filtered instrument/role
    const matchInstrument = filterScoreInstrument === 'all' || s.isDocument || s.allowedRoles?.includes(filterScoreInstrument);
    
    return matchSearch && matchType && matchCategory && matchInstrument;
  });

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchCategory.toLowerCase()));
  
  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchMember.toLowerCase()) || m.email.toLowerCase().includes(searchMember.toLowerCase()) || m.roles?.some((r: string) => r.toLowerCase().includes(searchMember.toLowerCase()));
    const matchRole = filterPersonalRole === 'all' || 
                      (filterPersonalRole === 'master' && m.isMaster) || 
                      (filterPersonalRole === 'archiver' && m.isArchiver) ||
                      (filterPersonalRole === 'banned' && m.isBanned) ||
                      (filterPersonalRole === 'external' && m.isExternal) ||
                      (filterPersonalRole === 'normal' && !m.isMaster && !m.isArchiver && !m.isBanned && !m.isExternal);
    const matchInst = filterPersonalInstrument === 'all' || m.roles?.includes(filterPersonalInstrument);
    return matchSearch && matchRole && matchInst;
  });

  return (
    <div className="admin-body-pure">
      <div className="admin-header-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
          <div className="admin-title-section">
            <h1>Gestión Archivo OCGC</h1>
            <p>Control de partituras, roles, categorías y personal</p>
          </div>
          {activeTab && (
            <button 
              onClick={() => setIsHelpOpen(true)} 
              className="btn-help-guide"
              style={{ background: '#e1f0ff', color: '#0070f3', border: '1px solid #74b9ff', padding: '0.4rem 1.2rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              ❓ Guía de sección
            </button>
          )}
        </div>

        <nav className="admin-nav-pills">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <button onClick={() => setActiveTab('scores')} className={activeTab === 'scores' ? 'active' : ''}>Partituras</button>
          <button onClick={() => setActiveTab('categories')} className={activeTab === 'categories' ? 'active' : ''}>Programas</button>
          <button onClick={() => setActiveTab('roles')} className={activeTab === 'roles' ? 'active' : ''}>Etiquetas</button>
          <button onClick={() => setActiveTab('calendar')} className={activeTab === 'calendar' ? 'active' : ''}>Calendario</button>
          {isMaster && (
            <>
              <button 
                onClick={() => setActiveTab('requests')} 
                className={activeTab === 'requests' ? 'active' : ''}
                style={{ position: 'relative' }}
              >
                Solicitudes
                {joinRequests.filter(r => r.status === 'Pendiente').length > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--clr-danger)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                    {joinRequests.filter(r => r.status === 'Pendiente').length}
                  </span>
                )}
              </button>
              <button onClick={() => setActiveTab('personal')} className={activeTab === 'personal' ? 'active' : ''}>Personal</button>
              <button onClick={() => setActiveTab('sections')} className={activeTab === 'sections' ? 'active' : ''}>Catálogos</button>
              <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}>Logs</button>
            </>
          )}
        </nav>
      </div>

      {isHelpOpen && <AdminGuideModal activeTab={activeTab!} onClose={() => setIsHelpOpen(false)} />}

      {activeTab === 'dashboard' && (
        <DashboardPanel members={members} scores={scores} />
      )}

      {activeTab === 'scores' && (
        <>
          <CSVImportScores categories={categories} onImportSuccess={() => loadData(true)} />
          <div className="admin-content-grid">
          <section className="admin-form-card">
            <h2>Añadir Partitura o Documento</h2>
            <form action="/api/scores/create" method="POST" encType="multipart/form-data" className="new-score-form" onSubmit={(e) => {
              const isDoc = (e.currentTarget.elements.namedItem("isDocument") as HTMLInputElement).checked;
              const catId = (e.currentTarget.elements.namedItem("categoryId") as HTMLSelectElement).value;
              if (!isDoc && !catId) {
                e.preventDefault();
                alert("Debes seleccionar un Programa para la partitura o marcarla como Documento.");
              }
              const isDocCheck = (e.currentTarget.elements.namedItem("isDocument") as HTMLInputElement).checked || uploadIsDoc;
              if (!isDocCheck && (selectedTags.length === 0 || selectedAgrupaciones.length === 0)) {
                 e.preventDefault();
                 alert("Debes seleccionar al menos una Agrupación y un Instrumento, o marcar la opción Documento para que todos puedan verlo.");
              }
            }}>
              <input type="text" name="title" placeholder="Título (ej: Sinfonía 9)" required value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
              <select name="categoryId" className="category-select">
                <option value="">Programa</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="file" name="file" accept=".pdf" required />
              
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Panel Agrupaciones */}
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>1. Seleccionar Agrupaciones:</p>
                  <div className="instrument-chips-grid">
                    {agrupaciones.map((a: any) => (
                      <label key={a.id} className={`instrument-chip ${selectedAgrupaciones.includes(a.agrupacion) ? 'selected' : ''}`}>
                        <input 
                          type="checkbox" 
                          name="agrupaciones" 
                          value={a.agrupacion} 
                          checked={selectedAgrupaciones.includes(a.agrupacion)} 
                          onChange={() => toggleAgrupacion(a.agrupacion)} 
                          style={{ display: 'none' }} 
                        />
                        {a.agrupacion}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Panel Secciones/Instrumentos */}
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>2. Seleccionar Secciones/Instrumentos:</p>
                  {Object.keys(tagsDict).length > 0 ? (
                    Object.entries(tagsDict).map(([familia, instrumentos]) => (
                      instrumentos.length > 0 && (
                        <div key={familia} style={{ marginBottom: '1.2rem' }}>
                          <h4 style={{ fontSize: '0.75rem', color: '#478AC9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem', borderLeft: '3px solid #478AC9', paddingLeft: '0.6rem' }}>{familia}</h4>
                        <div className="instrument-chips-grid">
                          {instrumentos.map((r: any) => (
                            <label key={r.name} className={`instrument-chip ${selectedTags.includes(r.name) ? 'selected' : ''}`}>
                              <input 
                                type="checkbox" 
                                name="roles" 
                                value={r.name} 
                                checked={selectedTags.includes(r.name)} 
                                onChange={() => toggleTag(r.name)} 
                                style={{ display: 'none' }} 
                              />
                              {r.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#999' }}>Cargando etiquetas de instrumentos...</p>
                  )}
                </div>
              </div>

              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0 0 1rem', fontSize: '0.9rem', color: '#555', cursor: 'pointer' }}>
                <input type="checkbox" name="isDocument" value="true" checked={uploadIsDoc} onChange={(e) => setUploadIsDoc(e.target.checked)} />
                Marcar como Documento General (Para Todos)
              </label>
              <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem', color: '#555', marginBottom: '1rem', border: '1px solid #dee2e6' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#333' }}>Nombre del archivo final que se guardará:</strong>
                <code style={{ background: '#e9ecef', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#0984e3' }}>
                  {uploadTitle ? `${uploadTitle.trim().replace(/[^a-zA-Z0-9_ -]/g, "_").replace(/\s+/g, "_")}_${uploadIsDoc ? "Documento" : (selectedTags.length > 0 ? selectedTags.map(r => r.replace(/[^a-zA-Z0-9]/g, "")).join("_") : "")}.pdf` : "esperando_datos.pdf"}
                </code>
              </div>
              <button type="submit" className="btn-main-admin">Publicar Archivo</button>
            </form>
          </section>

          <section className="admin-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Archivo Digital ({filteredScores.length})</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select value={filterScoreType} onChange={(e) => setFilterScoreType(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="all">Partituras / Docs</option>
                  <option value="score">Partituras</option>
                  <option value="document">Documentos</option>
                </select>
                <select value={filterScoreCategory} onChange={(e) => setFilterScoreCategory(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="all">Programas</option>
                  {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                </select>
                <select value={filterScoreInstrument} onChange={(e) => setFilterScoreInstrument(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="all">Filtro por Etiquetas</option>
                  {predefinedTags.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="text" placeholder="Buscar partitura..." value={searchScore} onChange={(e) => setSearchScore(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', minWidth: '150px' }} />
              </div>
            </div>
            <div className="table-scroll">
              <table className="inventory-table">
              <tbody>
                {filteredScores.map(s => (
                  <tr key={s.id}>
                    <td className="score-title">{s.title}</td>
                    <td className="score-roles">
                      {s.isDocument ? <span style={{color: '#e67e22', fontWeight: 600}}>DOCUMENTO</span> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>[ {s.allowedAgrupaciones?.join(", ") || "No asig."} ]</span>
                          <span>{s.allowedRoles?.join(", ") || "Todos"}</span>
                        </div>
                      )}
                    </td>
                    <td className="action-buttons">
                      <button onClick={() => setEditingScore(s)} className="btn-edit">Editar</button>
                      <button onClick={() => deleteScore(s.id)} className="btn-delete">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Modal Edición de Partitura */}
        {editingScore && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <div>
                  <h2>Editar: {editingScore.title}</h2>
                </div>
                <button onClick={() => setEditingScore(null)} className="btn-close-modal">✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Título</label>
                  <input type="text" value={editingScore.title} onChange={(e) => setEditingScore({...editingScore, title: e.target.value})} style={{ padding: '0.8rem', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Programa</label>
                  <select value={editingScore.categoryId || ''} onChange={(e) => setEditingScore({...editingScore, categoryId: e.target.value ? parseInt(e.target.value) : null})} style={{ padding: '0.8rem', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}>
                    <option value="">-- Sin programa --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <label style={{ fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingScore.isDocument} onChange={(e) => setEditingScore({...editingScore, isDocument: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  Es Documento General (Público para todos)
                </label>
                {!editingScore.isDocument && (
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Etiquetas asignadas al archivo</label>
                    <div className="instrument-chips-grid" style={{ marginTop: 0, padding: '1rem', border: '1px solid #eee', borderRadius: '8px', background: '#fcfcfc', maxHeight: '180px', overflowY: 'auto' }}>
                      {predefinedTags.map(r => {
                        const isSelected = editingScore.allowedRoles?.includes(r);
                        return (
                          <label key={r} className={`instrument-chip ${isSelected ? 'selected' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => {
                                const newRoles = isSelected 
                                  ? editingScore.allowedRoles.filter((ar:string) => ar !== r)
                                  : [...(editingScore.allowedRoles || []), r];
                                setEditingScore({...editingScore, allowedRoles: newRoles});
                              }}
                              style={{ display: 'none' }} 
                            />
                            {r}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingScore(null)} className="btn-cancel">Cancelar</button>
                <button onClick={updateScore} className="btn-save" style={{ padding: '0.8rem 2rem' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}
      </>
      )}

      {activeTab === 'categories' && (
        <>
        <div className="admin-content-grid">
          <section className="admin-form-card">
            <h2>Nuevo Programa</h2>
            <input
              type="text"
              placeholder="Nombre del programa"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              title="Fecha del evento o concierto"
              style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', color: '#555', marginBottom: '1rem' }}
            />
            <button onClick={createCategory} className="btn-main-admin">Crear Programa</button>
          </section>

          <section className="admin-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Programas ({filteredCategories.length})</h3>
              <input type="text" placeholder="Buscar programa..." value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', minWidth: '250px' }} />
            </div>
            <div className="table-scroll">
              <table className="inventory-table">
              <tbody>
                {filteredCategories.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        {c.eventDate && <span style={{fontSize:'0.8rem', color:'#888', backgroundColor: '#eee', padding: '0.2rem 0.6rem', borderRadius: '12px'}}>{new Date(c.eventDate).toLocaleDateString()}</span>}
                      </div>
                    </td>
                    <td className="action-buttons">
                      <button onClick={() => setEditingCategory(c)} className="btn-edit">Editar</button>
                      <button onClick={() => deleteCategory(c.id)} className="btn-delete">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Modal Edición de Categoria / Programa */}
        {editingCategory && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-card" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <div>
                  <h2>Editar Programa</h2>
                </div>
                <button onClick={() => setEditingCategory(null)} className="btn-close-modal">✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Nombre del Programa</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    style={{ padding: '0.8rem', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Fecha del evento (opcional)</label>
                  <input
                    type="date"
                    value={editingCategory.eventDate ? new Date(editingCategory.eventDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, eventDate: e.target.value })}
                    style={{ padding: '0.8rem', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingCategory(null)} className="btn-cancel">Cancelar</button>
                <button onClick={updateCategory} className="btn-save" style={{ padding: '0.8rem 2rem' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'roles' && (
        <>
        <div className="admin-content-grid">
          <section className="admin-form-card">
            <h2>Nuevo Instrumento / Etiqueta</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input
                type="text"
                placeholder="Nombre (ej: Violín)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <select value={newTagFamily} onChange={(e) => setNewTagFamily(e.target.value)} style={{padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px'}}>
                {DEFAULT_FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={createTag} className="btn-main-admin">Añadir Etiqueta</button>
            </div>
          </section>

          <section className="admin-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Diccionario de Etiquetas (Partituras)</h3>
              <input type="text" placeholder="Filtrar vista..." value={searchRole} onChange={(e) => setSearchRole(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', minWidth: '250px' }} />
            </div>
            
            <div className="dictionary-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(tagsDict).map(([familia, instrumentos]) => {
                 if (familia === 'Tuttis') return null; // Ocultar familia redundante Tutti
                 const matchInst = instrumentos.filter(i => i.name.toLowerCase().includes(searchRole.toLowerCase()));
                 if (matchInst.length === 0 && searchRole !== '') return null;
                 
                 return (
                  <div key={familia} className="family-block" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.2rem', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem', borderBottom: '2px solid #ddd', paddingBottom: '0.4rem' }}>{familia}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {matchInst.map(inst => (
                        <div key={inst.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ccc', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                          <span>{inst.name}</span>
                          <button 
                            onClick={() => setEditingTag({ id: inst.id, name: inst.name })} 
                            style={{ marginLeft: '8px', border: 'none', background: 'none', color: '#478AC9', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => deleteTag(inst.id)} 
                            style={{ marginLeft: '4px', border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                 )
              })}
            </div>
          </section>
        </div>

        {/* Modal Edición de Rol / Instrumento */}
        {editingTag && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-card" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <div>
                  <h2>Editar Instrumento o Etiqueta</h2>
                </div>
                <button onClick={() => setEditingTag(null)} className="btn-close-modal">✕</button>
              </div>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Nombre</label>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    style={{ padding: '0.8rem', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingTag(null)} className="btn-cancel">Cancelar</button>
                <button onClick={async () => {
                  if (!editingTag.name.trim()) return;
                  try {
                    const res = await fetch(`/api/roles/${editingTag.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: editingTag.name })
                    });
                    if (res.ok) {
                      loadData(true);
                      setEditingTag(null);
                    } else {
                      alert("No se ha podido actualizar la etiqueta.");
                    }
                  } catch(e) { }
                }} className="btn-save" style={{ padding: '0.8rem 2rem' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'sections' && (
        <div className="admin-content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* COLUMNA 1: AGRUPACIONES */}
          <section className="admin-form-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎭 Agrupaciones</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.2rem' }}>Conjuntos artísticos de la OCGC (Orquesta, Coro, etc.).</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Nueva agrupación..."
                value={newAgrupacionName}
                onChange={(e) => setNewAgrupacionName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={createAgrupacion} className="btn-main-admin" disabled={isCreatingAgrupacion} style={{ padding: '0.5rem 1rem', width: 'auto' }}>
                {isCreatingAgrupacion ? "..." : "+"}
              </button>
            </div>
            
            <div className="catalog-scroll-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {agrupaciones.map((a: any) => (
                <div key={a.id} className="catalog-item-row">
                  <span>{a.agrupacion}</span>
                  <button onClick={() => deleteAgrupacion(a.id)} className="btn-delete-small">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* COLUMNA 2: PAPELES */}
          <section className="admin-form-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👤 Papeles</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.2rem' }}>Funciones de los miembros (Músico, Director, etc.).</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Nuevo papel..."
                value={newPapelName}
                onChange={(e) => setNewPapelName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={createPapel} className="btn-main-admin" disabled={isCreatingPapel} style={{ padding: '0.5rem 1rem', width: 'auto' }}>
                {isCreatingPapel ? "..." : "+"}
              </button>
            </div>
            
            <div className="catalog-scroll-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {papeles.map((p: any) => (
                <div key={p.id} className="catalog-item-row">
                  <span>{p.papel}</span>
                  <button onClick={() => deletePapel(p.id)} className="btn-delete-small">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* COLUMNA 3: SECCIONES */}
          <section className="admin-form-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎻 Secciones</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.2rem' }}>Puestos específicos (Soprano I, Violín II, Trombón...).</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Nueva sección..."
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={createSection} className="btn-main-admin" disabled={isCreatingSection} style={{ padding: '0.5rem 1rem', width: 'auto' }}>
                {isCreatingSection ? "..." : "+"}
              </button>
            </div>
            
            <div className="catalog-scroll-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {secciones.sort((a,b) => a.seccion.localeCompare(b.seccion)).map((s: any) => (
                <div key={s.id} className="catalog-item-row">
                  <span>{s.seccion}</span>
                  <button onClick={() => deleteSection(s.id)} className="btn-delete-small">×</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isMaster && activeTab === 'personal' && (
        <section className="admin-list-card">
          <div className="invitation-generation-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🎟️ Invitaciones e Incorporación</h3>
              <button 
                onClick={() => setIsManualCreateOpen(true)}
                className="btn-main-admin"
                style={{ width: 'auto', padding: '0.6rem 1.2rem', background: 'var(--clr-navy)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                👤 Crear Usuario Manualmente
              </button>
            </div>
            
            <div className="invitation-expanded-form">
              <div className="invite-row-grid-2col" style={{ marginBottom: '1.5rem' }}>  
                <input 
                  type="text" 
                  placeholder="Nombre de pila..." 
                  value={inviteName} 
                  onChange={(e) => setInviteName(e.target.value)} 
                />
                <input 
                  type="text" 
                  placeholder="Apellidos..." 
                  value={inviteSurname} 
                  onChange={(e) => setInviteSurname(e.target.value)} 
                />
              </div>

              <div className="invite-row-grid-2col" style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="email" 
                  placeholder="Email (opcional)" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                />
                <input 
                  type="tel" 
                  placeholder="Teléfono móvil (opcional)" 
                  value={invitePhone} 
                  onChange={(e) => setInvitePhone(e.target.value)} 
                />
              </div>

              <div className="invitation-section">
                <h4>Perfil Artístico 1 (Principal)</h4>
                <div className="invite-row-grid-2col">
                  <select value={inviteAgrupacion} onChange={(e) => setInviteAgrupacion(e.target.value)}>
                    <option value="">-- Agrupación 1 --</option>
                    {agrupaciones.map(a => <option key={a.id} value={a.agrupacion}>{a.agrupacion}</option>)}
                  </select>
                  <select value={inviteSection} onChange={(e) => setInviteSection(e.target.value)}>
                    <option value="">-- Sección 1 --</option>
                    {[...secciones].sort((a,b) => a.seccion.localeCompare(b.seccion)).map(s => <option key={s.id} value={s.seccion}>{s.seccion}</option>)}
                  </select>
                </div>
              </div>

              <div className="invitation-section">
                <h4>Perfil Artístico 2 (Opcional)</h4>
                <div className="invite-row-grid-2col">
                  <select value={inviteAgrupacion2} onChange={(e) => setInviteAgrupacion2(e.target.value)}>
                    <option value="">-- Agrupación 2 --</option>
                    {agrupaciones.map(a => <option key={a.id} value={a.agrupacion}>{a.agrupacion}</option>)}
                  </select>
                  <select value={inviteSection2} onChange={(e) => setInviteSection2(e.target.value)}>
                    <option value="">-- Sección 2 --</option>
                    {[...secciones].sort((a,b) => a.seccion.localeCompare(b.seccion)).map(s => <option key={s.id} value={s.seccion}>{s.seccion}</option>)}
                  </select>
                </div>
              </div>

              <div className="invitation-section" style={{ borderBottom: 'none', marginBottom: '1.5rem' }}>
                <h4>Perfil Artístico 3 (Opcional)</h4>
                <div className="invite-row-grid-2col">
                  <select value={inviteAgrupacion3} onChange={(e) => setInviteAgrupacion3(e.target.value)}>
                    <option value="">-- Agrupación 3 --</option>
                    {agrupaciones.map(a => <option key={a.id} value={a.agrupacion}>{a.agrupacion}</option>)}
                  </select>
                  <select value={inviteSection3} onChange={(e) => setInviteSection3(e.target.value)}>
                    <option value="">-- Sección 3 --</option>
                    {[...secciones].sort((a,b) => a.seccion.localeCompare(b.seccion)).map(s => <option key={s.id} value={s.seccion}>{s.seccion}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => createInvitation(true)} 
                  className="btn-generate-invite send"
                  disabled={isGeneratingInvite || !inviteEmail}
                  title={!inviteEmail ? "Introduce un email para enviar la invitación" : ""}
                >
                  {isGeneratingInvite ? (
                    <span className="btn-loader"></span>
                  ) : (
                    <>✨ Enviar por Email</>
                  )}
                </button>
                <button 
                  onClick={() => createInvitation(false)} 
                  className="btn-generate-invite link"
                  disabled={isGeneratingInvite}
                >
                  {isGeneratingInvite ? (
                    <span className="btn-loader"></span>
                  ) : (
                    <>🔗 Sólo Generar Link</>
                  )}
                </button>
              </div>
            </div>
            
            {lastGeneratedLink && (
              <div className="generated-link-alert">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#478AC9', fontWeight: 'bold', textTransform: 'uppercase' }}>✓ Enlace Generado para {inviteName || "Invitado"}</span>
                    <code style={{ fontSize: '0.85rem', color: '#333', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d0e6f8', display: 'block', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastGeneratedLink}</code>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(lastGeneratedLink)} 
                    style={{ background: '#478AC9', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    Copiar Link 📋
                  </button>
                </div>
              </div>
            )}

            <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#666' }}>
              El código será de 1 solo uso y caducará automáticamente en 7 días si no se utiliza.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Gestión de Personal ({members.length})</h3>
            <button onClick={() => {
              const h = "Nombre,Email,Instrumentos,Master,Archivero,Baneado\n";
              const r = filteredMembers.map((m: any) => `"${m.name}","${m.email}","${m.roles.join(', ')}",${m.isMaster},${m.isArchiver},${m.isBanned}`).join('\n');
              const url = URL.createObjectURL(new Blob([h + r], { type: 'text/csv;charset=utf-8;' }));
              const l = document.createElement("a");
              l.href = url; l.download = "miembros_ocgc.csv";
              l.click();
            }} className="btn-main-admin" style={{width: 'auto'}}>📄 Exportar CSV</button>
          </div>

          {/* Sección de Invitaciones Activas */}
          {invitations.length > 0 && (
            <div className="invitations-section" style={{ marginBottom: '2.5rem', padding: '1.2rem', background: '#fff9db', borderRadius: '12px', border: '1px solid #fab005' }}>
              <h4 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#856404' }}>
                📋 Invitaciones Pendientes de Uso ({invitations.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {invitations.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '10px', border: '1px solid #ffeeba', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1a1a1a' }}>
                        {inv.name ? `${inv.name} ${inv.surname || ''}`.trim() : "Invitado sin nombre"} 
                        {inv.sentToEmail && <span style={{ fontSize: '0.8rem', marginLeft: '8px', fontWeight: 'normal', color: 'var(--clr-success)' }}>(Enviada a: {inv.sentToEmail})</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <code style={{ color: '#478AC9', fontSize: '0.9rem', background: '#f1f7fd', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{inv.code}</code>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>Expira: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/registro-usuarios?code=${inv.code}`;
                          navigator.clipboard.writeText(url);
                          alert("Enlace copiado. Compártelo con el músico.");
                        }}
                        className="btn-copy-link"
                      >
                        Copiar Link 🔗
                      </button>
                      <button onClick={() => deleteInvitation(inv.id)} style={{ padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }} title="Revocar">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select value={filterPersonalRole} onChange={(e) => setFilterPersonalRole(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="all">Todos los permisos</option>
              <option value="normal">Músicos (Sin admin)</option>
               <option value="archiver">Archiveros</option>
              <option value="master">Masters</option>
              <option value="external">Externos (Sin Acceso)</option>
              <option value="banned">Bloqueados</option>
            </select>
            <select value={filterPersonalInstrument} onChange={(e) => setFilterPersonalInstrument(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="all">Filtrar por Etiqueta</option>
              {predefinedTags.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="text" placeholder="Nombre/Email..." value={searchMember} onChange={(e) => setSearchMember(e.target.value)} style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', minWidth: '200px' }} />
          </div>
          <CSVImportUsers onImportSuccess={() => loadMembers(true)} />
          <div className="table-scroll">
            <table className="personal-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Instrumentos</th>
                  <th>Master</th>
                  <th>Archivero</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m.id} className={`${m.isBanned ? 'tr-banned' : ''} ${m.isExternal ? 'tr-external' : ''}`}>
                    <td className="member-name">
                      {m.name}
                      {m.isExternal && <span className="badge-external" style={{ marginLeft: '0.5rem', background: '#ffeaa7', color: '#d35400', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Externo</span>}
                    </td>
                    <td className="member-email">{m.email}</td>
                    <td className="member-roles">
                      <span>{m.roles.length > 0 ? m.roles.join(", ") : "—"}</span>
                    </td>
                    <td className="status-cell">
                      <button
                        onClick={() => toggleMasterStatus(m.id, m.isMaster)}
                        className={`btn-status ${m.isMaster ? 'active' : ''}`}
                        title="Master: Acceso total al panel de administración"
                      >
                        {m.isMaster ? "✓" : "🚫"}
                      </button>
                    </td>
                    <td className="status-cell">
                      <button
                        onClick={() => toggleArchiverStatus(m.id, m.isArchiver)}
                        className={`btn-status ${m.isArchiver ? 'active' : ''}`}
                        title="Archivero: Puede gestionar partituras"
                      >
                        {m.isArchiver ? "✓" : "🚫"}
                      </button>
                    </td>
                    <td className="status-cell">
                      <button
                        onClick={() => toggleBanStatus(m.id, m.isBanned)}
                        className={`btn-status ${m.isBanned ? 'banned' : 'active'}`}
                        title={m.isBanned ? "Usuario baneado - no puede entrar" : "Usuario activo"}
                      >
                        {m.isBanned ? "🚫" : "✓"}
                      </button>
                    </td>
                    <td className="action-buttons">
                      <button onClick={() => {
                        setEditingMemberData({...m, isExternal: !!m.isExternal});
                        setSelectedMemberTags(m.roles || []);
                      }} className="btn-edit" title="Editar instrumentos">✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Edición de Miembro */}
          {editingMemberData && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-card">
                <div className="modal-header">
                  <div>
                    <h2>Editar Perfil: {editingMemberData.name}</h2>
                    <p>{editingMemberData.email}</p>
                  </div>
                  <button onClick={() => setEditingMemberData(null)} className="btn-close-modal">✕</button>
                </div>
                
                <div className="modal-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--clr-navy)' }}>Perfil Artístico y Ubicación (Base de Datos)</h3>
                  <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
                    <table className="personal-table" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                      <thead>
                        <tr>
                          <th>Agrupación</th>
                          <th>Sección</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                          <th>Atril</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingMemberData.estructuras && editingMemberData.estructuras.length > 0 ? (
                          editingMemberData.estructuras.map((est: any) => (
                            <tr key={est.id}>
                              <td style={{ fontSize: '0.85rem' }}>{est.agrupacion}</td>
                              <td style={{ fontSize: '0.85rem' }}>{est.seccion}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => updateEstructura(editingMemberData.id, est.id, { activo: !est.activo })}
                                  className={`btn-status ${est.activo ? 'active' : ''}`}
                                  style={{ padding: '0.3rem', minWidth: '2rem', fontSize: '0.8rem' }}
                                >
                                  {est.activo ? "✓" : "🚫"}
                                </button>
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  defaultValue={est.atril || ""}
                                  onBlur={(e) => {
                                    if (e.target.value !== (est.atril?.toString() || "")) {
                                      updateEstructura(editingMemberData.id, est.id, { atril: e.target.value });
                                    }
                                  }}
                                  style={{ width: '60px', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Sin perfiles registrados en DB</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!editingMemberData.isExternal && (
                    <>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--clr-navy)' }}>Permisos de Acceso a Partituras (Clerk)</h3>
                      <div className="role-selector-grid">
                        {[...predefinedTags]
                          .filter(r => !r.includes("- Tutti")) // Ocultar Tutti en edición de miembros
                          .sort((a,b) => a.localeCompare(b))
                          .map(r => (
                            <label key={r} className={`role-chip-card ${selectedMemberTags.includes(r) ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedMemberTags.includes(r)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMemberTags([...selectedMemberTags, r]);
                                } else {
                                  setSelectedMemberTags(selectedMemberTags.filter(sr => sr !== r));
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                            <span className="chip-check">{selectedMemberTags.includes(r) ? '✓' : '+'}</span>
                            <span className="chip-text">{r}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  {!editingMemberData.isExternal && (
                    <div className="modal-permissions-summary" style={{ marginTop: '2rem', padding: '1.2rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--clr-navy)' }}>Gestión de Accesos:</p>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <button
                            onClick={() => {
                               toggleMasterStatus(editingMemberData.id, editingMemberData.isMaster);
                               // No actualizamos localmente aquí porque toggleMasterStatus 
                               // puede abrir el modal de activation y no queremos estado inconsistente
                            }}
                            className={`btn-status ${editingMemberData.isMaster ? 'active' : ''}`}
                            style={{ padding: '0.6rem', fontSize: '1.1rem' }}
                          >
                            {editingMemberData.isMaster ? "✓" : "🚫"}
                          </button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Master</span>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>Acceso total</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <button
                            onClick={() => {
                              toggleArchiverStatus(editingMemberData.id, editingMemberData.isArchiver);
                            }}
                            className={`btn-status ${editingMemberData.isArchiver ? 'active' : ''}`}
                            style={{ padding: '0.6rem', fontSize: '1.1rem' }}
                          >
                            {editingMemberData.isArchiver ? "✓" : "🚫"}
                          </button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Archivero</span>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>Gestión doc.</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <button
                            onClick={() => {
                              toggleBanStatus(editingMemberData.id, editingMemberData.isBanned);
                              // Cerramos el modal de edición para evitar confusión si se activa el flujo de ban/unban masivo
                              setEditingMemberData(null);
                            }}
                            className={`btn-status ${editingMemberData.isBanned ? 'banned' : 'active'}`}
                            style={{ padding: '0.6rem', fontSize: '1.1rem' }}
                          >
                            {editingMemberData.isBanned ? "🚫" : "✓"}
                          </button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Estado</span>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>{editingMemberData.isBanned ? 'Baneado' : 'Activo'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button onClick={() => setEditingMemberData(null)} className="btn-cancel">Cancelar</button>
                  <button onClick={() => {
                    if (!editingMemberData.isExternal) {
                      updateMemberRoles(editingMemberData.id);
                    }
                    setEditingMemberData(null);
                  }} className="btn-save" style={{ padding: '0.8rem 2rem' }}>Guardar Cambios</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Activación de Acceso (Upgrade) */}
          {upgradingMember && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-card" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                  <div>
                    <h2 style={{ fontSize: '1.2rem' }}>⚠️ Activación de Acceso</h2>
                    <p style={{ fontSize: '0.8rem' }}>"{upgradingMember.name}" no tiene cuenta en la plataforma.</p>
                  </div>
                  <button onClick={() => setUpgradingMember(null)} className="btn-close-modal">✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                    Para dar permisos de <strong>{upgradingMember.targetRole === 'master' ? 'Master' : 'Archivero'}</strong>, primero es necesario crear una sesión de usuario oficial.
                  </p>
                  
                  <div className="manual-form-grid">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Email del usuario</label>
                    <input 
                      type="email" 
                      value={upgradeData.email} 
                      onChange={(e) => setUpgradeData({...upgradeData, email: e.target.value})} 
                      placeholder="ejemplo@correo.com"
                      style={{ marginBottom: '1rem' }}
                    />

                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Nombre de Usuario</label>
                    <input 
                      type="text" 
                      value={upgradeData.username} 
                      onChange={(e) => setUpgradeData({...upgradeData, username: e.target.value})} 
                      placeholder="usuario_ocgc"
                      style={{ marginBottom: '1rem' }}
                    />

                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Contraseña Temporal</label>
                    <input 
                      type="password" 
                      value={upgradeData.password} 
                      onChange={(e) => setUpgradeData({...upgradeData, password: e.target.value})} 
                      placeholder="Min. 8 caracteres"
                    />
                  </div>

                  <div style={{ padding: '1rem', background: '#fff9db', borderRadius: '10px', fontSize: '0.8rem', color: '#856404', border: '1px solid #ffeeba', marginTop: '0.5rem' }}>
                    💡 Tras activar el acceso, el usuario podrá entrar y cambiar su contraseña.
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => setUpgradingMember(null)} className="btn-cancel">Cancelar</button>
                  <button 
                    onClick={upgradeToPlatform} 
                    className="btn-save" 
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? "Activando..." : "Activar y Dar Permiso"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Creación Manual de Usuario */}
          {isManualCreateOpen && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-card" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                  <div>
                    <h2>Crear Usuario Manualmente</h2>
                    <p>Ideal para administradores, archiveros o músicos que no pueden usar el enlace.</p>
                  </div>
                  <button onClick={() => setIsManualCreateOpen(false)} className="btn-close-modal">✕</button>
                </div>
                
                <div className="modal-body">
                  <div className="manual-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Nombre de pila *</label>
                      <input type="text" value={manualUser.firstName} onChange={(e) => setManualUser({...manualUser, firstName: e.target.value})} placeholder="Ej: Juan" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Apellidos</label>
                      <input type="text" value={manualUser.surname} onChange={(e) => setManualUser({...manualUser, surname: e.target.value})} placeholder="Ej: Pérez García" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Email {manualUser.isExternal ? '(Opcional)' : '*'}</label>
                      <input type="email" value={manualUser.email} onChange={(e) => setManualUser({...manualUser, email: e.target.value})} placeholder="ejemplo@correo.com" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>DNI / NIE *</label>
                      <input type="text" value={manualUser.dni} onChange={(e) => setManualUser({...manualUser, dni: e.target.value})} placeholder="12345678X" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Matrícula de Coche (Opcional)</label>
                      <input type="text" value={manualUser.matricula} onChange={(e) => setManualUser({...manualUser, matricula: e.target.value})} placeholder="Ej: 1234 ABC" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Teléfono</label>
                      <input type="text" value={manualUser.phone} onChange={(e) => setManualUser({...manualUser, phone: e.target.value})} placeholder="+34 600 000 000" />
                    </div>
                    <div style={{ opacity: manualUser.isExternal ? 0.5 : 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Nombre de Usuario *</label>
                      <input type="text" value={manualUser.username} onChange={(e) => setManualUser({...manualUser, username: e.target.value})} placeholder="usuario_ocgc" disabled={manualUser.isExternal} />
                    </div>
                    <div style={{ opacity: manualUser.isExternal ? 0.5 : 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem', display: 'block' }}>Contraseña *</label>
                      <input type="text" value={manualUser.password} onChange={(e) => setManualUser({...manualUser, password: e.target.value})} placeholder="Mínimo 8 caract." disabled={manualUser.isExternal} />
                    </div>
                  </div>

                  <div className="permissions-section" style={{ background: '#f8f9fa', padding: '1.2rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #eee' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--clr-navy)' }}>Configuración de Acceso y Permisos</h4>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: manualUser.isExternal ? 'var(--clr-primary)' : '#666' }}>
                        <input type="checkbox" checked={manualUser.isExternal} onChange={(e) => setManualUser({...manualUser, isExternal: e.target.checked, username: '', password: '', isMaster: false, isArchiver: false})} />
                        🚫 Externo (Sin acceso al sistema)
                      </label>
                      {!manualUser.isExternal && (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input type="checkbox" checked={manualUser.isMaster} onChange={(e) => setManualUser({...manualUser, isMaster: e.target.checked})} />
                            Administrador (Master)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input type="checkbox" checked={manualUser.isArchiver} onChange={(e) => setManualUser({...manualUser, isArchiver: e.target.checked})} />
                            Archivero
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="artistic-profiles-section">
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--clr-navy)' }}>Perfiles Artísticos (Si es músico)</h4>
                    {manualUser.artisticProfiles.map((profile, index) => (
                      <div key={index} className="invite-row-grid" style={{ marginBottom: '0.8rem' }}>
                        <select 
                          value={profile.papel} 
                          onChange={(e) => {
                            const newProfiles = [...manualUser.artisticProfiles];
                            newProfiles[index].papel = e.target.value;
                            setManualUser({...manualUser, artisticProfiles: newProfiles});
                          }}
                        >
                          <option value="">-- Papel --</option>
                          {papeles.map(p => <option key={p.id} value={p.papel}>{p.papel}</option>)}
                        </select>
                        <select 
                          value={profile.agrupacion} 
                          onChange={(e) => {
                            const newProfiles = [...manualUser.artisticProfiles];
                            newProfiles[index].agrupacion = e.target.value;
                            setManualUser({...manualUser, artisticProfiles: newProfiles});
                          }}
                        >
                          <option value="">-- Agrupación --</option>
                          {agrupaciones.map(a => <option key={a.id} value={a.agrupacion}>{a.agrupacion}</option>)}
                        </select>
                        <select 
                          value={profile.seccion} 
                          onChange={(e) => {
                            const newProfiles = [...manualUser.artisticProfiles];
                            newProfiles[index].seccion = e.target.value;
                            setManualUser({...manualUser, artisticProfiles: newProfiles});
                          }}
                        >
                          <option value="">-- Sección --</option>
                          {[...secciones].sort((a,b) => a.seccion.localeCompare(b.seccion)).map(s => <option key={s.id} value={s.seccion}>{s.seccion}</option>)}
                        </select>
                        {manualUser.artisticProfiles.length > 1 && (
                          <button onClick={() => {
                            const newProfiles = manualUser.artisticProfiles.filter((_, i) => i !== index);
                            setManualUser({...manualUser, artisticProfiles: newProfiles});
                          }} style={{ background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => setManualUser({...manualUser, artisticProfiles: [...manualUser.artisticProfiles, { agrupacion: '', seccion: '', papel: 'Músico' }]})}
                      style={{ background: '#eee', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Añadir otra agrupación
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={() => setIsManualCreateOpen(false)} className="btn-cancel">Cancelar</button>
                  <button 
                    onClick={createManualUser} 
                    className="btn-save" 
                    style={{ padding: '0.8rem 2rem' }}
                    disabled={isCreatingManual}
                  >
                    {isCreatingManual ? "Creando..." : "Crear Usuario"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="personal-legend">
            <p><strong>Legendas:</strong></p>
            <ul>
              <li><strong>Master:</strong> Acceso completo al panel de administración</li>
              <li><strong>Archivero:</strong> Puede crear, editar y eliminar partituras</li>
              <li><strong>Estado:</strong> ✓ Activo | 🚫 Baneado (no puede entrar)</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'calendar' && <CalendarPanel />}
      {activeTab === 'logs' && isMaster && <LogsPanel />}

      <style jsx>{`
        .admin-body-pure { width: 100%; }
        .admin-header-box { display: flex; flex-direction: column; margin-bottom: 2.5rem; }
        .admin-title-section { flex: 1; }
        .admin-title-section h1 { margin: 0 0 0.3rem; font-size: 1.8rem; color: #333; }
        .admin-title-section p { margin: 0; color: #999; font-size: 0.9rem; }
        .admin-nav-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .admin-nav-pills button { padding: 0.6rem 1.4rem; border-radius: 50px; border: none; cursor: pointer; font-weight: 700; background: #eee; font-size: 0.85rem; transition: all 0.2s; }
        .admin-nav-pills button:hover { background: #ddd; }
        .admin-nav-pills button.active { background: #478AC9; color: white; }
        .admin-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .admin-form-card, .admin-list-card { background: #fbfbfc; padding: 2rem; border-radius: 12px; border: 1px solid #f0f0f0; }
        
        /* Responsive join requests */
        .request-card-responsive {
          padding: 1.5rem;
          background: #fff;
          border-radius: 12px;
          border: 1px solid var(--clr-border);
          box-shadow: var(--shadow-xs);
          display: grid;
          grid-template-columns: 2fr 1fr auto;
          gap: 1.5rem;
          align-items: start;
        }
        .request-contact-info { margin: 0; font-size: 0.9rem; color: var(--clr-text-muted); display: flex; gap: 1rem; flex-wrap: wrap; }
        
        @media (max-width: 900px) {
          .admin-content-grid { grid-template-columns: 1fr; gap: 1rem; }
          .request-card-responsive { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
          .request-interest-info { text-align: left; border-top: 1px solid #eee; padding-top: 1rem; }
          .request-actions-area { width: 100%; display: flex; flex-direction: column; gap: 0.8rem; }
          .admin-form-card, .admin-list-card { padding: 1.2rem; }
          .admin-header-box { margin-bottom: 1.5rem; }
        }

        .admin-form-card h2, .admin-form-card h3 { margin-top: 0; margin-bottom: 1.5rem; color: #333; }
        .admin-form-card input[type="text"], .admin-form-card input[type="file"], .admin-form-card select { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
        .instrument-chips-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
        .instrument-chip { padding: 0.4rem 0.8rem; background: #fff; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
        .instrument-chip:hover { border-color: #478AC9; }
        .instrument-chip.selected { background: #478AC9; color: white; border-color: #478AC9; }
        .btn-main-admin { width: 100%; padding: 1rem; background: #478AC9; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; }
        .btn-main-admin:hover { background: #3a6ca3; }
        .inventory-table, .personal-table { width: 100%; border-collapse: collapse; }
        .inventory-table td, .personal-table td, .personal-table th { padding: 1rem 0.8rem; border-bottom: 1px solid #eee; text-align: left; font-size: 0.9rem; }
        .personal-table th { background: #f5f5f5; font-weight: 700; color: #666; font-size: 0.85rem; }
        .score-title { font-weight: 500; color: #333; }
        .score-roles { color: #999; font-size: 0.85rem; }
        .member-name { font-weight: 600; color: #333; }
        .member-email { color: #666; font-size: 0.85rem; }
        .member-roles { color: #666; font-size: 0.85rem; }
        .status-cell { text-align: center; }
        .tr-banned { opacity: 0.6; background: #fef5f5; }
        .action-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .btn-edit, .btn-delete, .btn-save, .btn-cancel, .btn-status, .btn-toggle { padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; }
        .btn-edit { background: #E8F0F7; color: #478AC9; }
        .btn-delete { background: #FDE8E8; color: #d63031; }
        .btn-save { background: #E8F5E9; color: #2ecc71; }
        .btn-cancel { background: #F0F0F0; color: #666; }
        .btn-status { background: #F0F0F0; color: #999; padding: 0.5rem; min-width: 2.5rem; font-size: 1rem; border-radius: 50%; }
        .btn-status:hover { background: #E0E0E0; }
        .btn-status.active { background: #E8F5E9; color: #2ecc71; border: 1px solid #2ecc71; }
        .btn-status.active:hover { background: #2ecc71; color: white; }
        .btn-status.banned { background: #FDE8E8; color: #ff4757; border: 1px solid #ff4757; }
        .btn-status.banned:hover { background: #ff4757; color: white; }
        .btn-toggle { background: #f0f0f0; color: #666; }
        .btn-toggle.active { background: #2ecc71; color: white; }
        .btn-edit:hover { background: #D1E5F0; }
        .btn-delete:hover { background: #F5D1D1; }
        .btn-save:hover { background: #C8E6C9; }
        .btn-cancel:hover { background: #E0E0E0; }

        /* Estilos para gestión de catálogos */
        .catalog-scroll-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .catalog-item-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 0.6rem 0.8rem; 
          background: #fff; 
          border: 1px solid #eee; 
          border-radius: 8px; 
          font-size: 0.85rem; 
          transition: all 0.2s;
        }
        .catalog-item-row:hover { background: #fdfdfd; border-color: #ddd; }
        .btn-delete-small {
          background: none;
          border: none;
          color: #e74c3c;
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
          padding: 0 0.3rem;
          border-radius: 4px;
        }
        .btn-delete-small:hover { background: #fde8e8; }

        /* Invitaciones Inline Styles */
        .invitation-generation-box {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #dee2e6;
          margin-bottom: 2rem;
        }
        .invitation-form-row, .invitation-expanded-form {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .invitation-generation-box input, .invitation-generation-box select {
          padding: 0.9rem 1.2rem;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          font-size: 0.95rem;
          background: #fbfcfe;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
          color: #2c3e50;
        }
        .invitation-generation-box input::placeholder {
          color: #95a5a6;
          opacity: 0.8;
        }
        .invitation-generation-box input:focus, .invitation-generation-box select:focus {
          border-color: #478AC9;
          outline: none;
          box-shadow: 0 0 0 3px rgba(71, 138, 201, 0.1);
          background: #fff;
        }
        .invitation-generation-box h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          color: #7f8c8d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .invite-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
          align-items: end;
        }
        .invite-row-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .invitation-section {
          border-top: 1px solid #f0f0f0;
          padding-top: 1.2rem;
          margin-bottom: 1.2rem;
        }
        
        .btn-generate-invite {
          padding: 1.2rem;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: white;
          width: 100%;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .btn-generate-invite.link { background: linear-gradient(135deg, var(--clr-navy) 0%, #2c3e50 100%); }
        .btn-generate-invite.send { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); }
        .btn-generate-invite:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .btn-generate-invite:active { transform: translateY(-1px); }
        .btn-generate-invite:disabled { opacity: 0.6; cursor: wait; transform: none; }

        .btn-loader {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .generated-link-alert {
          margin-top: 1.5rem;
          padding: 1.2rem;
          background: #e7f5ff;
          border: 1px dashed #478AC9;
          border-radius: 12px;
          animation: pulse 2s infinite;
        }

        @media (max-width: 900px) {
          .invitation-form-row {
            flex-direction: column;
            align-items: stretch;
          }
          .invitation-form-row input, .invitation-form-row select, .btn-generate-invite {
            width: 100%;
          }
        }

        .role-selector-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
          gap: 0.6rem; 
          background: #fff; 
          padding: 1.2rem; 
          border-radius: 12px; 
          border: 1px solid #e1e8ed;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        }
        .role-chip-card {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.8rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .role-chip-card:hover {
          border-color: var(--clr-primary);
          background: #f1f7fd;
          transform: translateY(-1px);
        }
        .role-chip-card.selected {
          background: var(--clr-primary);
          border-color: var(--clr-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(71, 138, 201, 0.2);
        }
        .chip-check {
          font-weight: 800;
          font-size: 0.8rem;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: rgba(0,0,0,0.05);
        }
        .role-chip-card.selected .chip-check {
          background: rgba(255,255,255,0.2);
        }
        .chip-text {
          font-size: 0.8rem;
          font-weight: 500;
          line-height: 1.2;
        }

        /* Modal Styles */
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .admin-modal-card {
          background: #fff;
          width: 100%;
          max-width: 700px;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); } to { transform: translateY(0); } }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #fbfcfe;
        }
        .modal-header h2 { margin: 0; font-size: 1.4rem; color: var(--clr-navy); font-weight: 800; }
        .modal-header p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #7f8c8d; }
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 1.2rem 2rem; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 1rem; background: #fbfcfe; }
        .btn-close-modal { background: none; border: none; font-size: 1.5rem; color: #ccc; cursor: pointer; transition: 0.2s; }
        .btn-close-modal:hover { color: #333; transform: rotate(90deg); }

        .manual-form-grid input {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #e1e8ed;
          border-radius: 10px;
          font-size: 0.9rem;
          background: #fff;
          transition: all 0.2s;
        }
        .manual-form-grid input:focus {
          border-color: var(--clr-primary);
          box-shadow: 0 0 0 3px rgba(71, 138, 201, 0.1);
          outline: none;
        }
        .artistic-profiles-section select {
          padding: 0.8rem;
          border: 1px solid #e1e8ed;
          border-radius: 10px;
          font-size: 0.9rem;
          background: #fff;
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #fbfcfe;
        }
        .modal-header h2 { margin: 0; font-size: 1.4rem; color: var(--clr-navy); font-weight: 800; }
        .modal-header p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #7f8c8d; }
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 1.2rem 2rem; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 1rem; background: #fbfcfe; }
        
        .btn-close-modal { 
          background: #f0f2f5; 
          border: none; 
          width: 36px; 
          height: 36px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 1.2rem; 
          color: #666; 
          cursor: pointer; 
          transition: 0.2s; 
        }
        .btn-close-modal:hover { background: #e4e6e9; color: var(--clr-danger); transform: rotate(90deg); }

        .table-scroll { overflow-x: auto; }
        .personal-legend { margin-top: 2rem; padding: 1.5rem; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #478AC9; }
        .personal-legend p { margin: 0 0 1rem; font-weight: 600; color: #333; }
        .personal-legend ul { margin: 0; padding-left: 1.5rem; list-style: none; }
        .personal-legend li { margin: 0.5rem 0; font-size: 0.85rem; color: #666; padding-left: 1.5rem; position: relative; }
        .personal-legend li:before { content: "→"; position: absolute; left: 0; }

        /* Estilos específicos para el link secreto */
        .personal-header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .secret-link-box { display: flex; align-items: center; gap: 0.8rem; background: #fff; padding: 0.6rem 1rem; border: 1px dashed #478AC9; border-radius: 8px; }
        .secret-link-box span { font-size: 0.8rem; font-weight: bold; color: #666; }
        .btn-copy-link { background: #478AC9; color: white; border: none; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: 0.2s; }
        .btn-copy-link:hover { background: #357ABD; transform: translateY(-1px); }
      `}</style>
      {isMaster && activeTab === 'requests' && (
        <section className="admin-list-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ color: 'var(--clr-navy)', margin: 0 }}>📩 Bandeja de Entrada</h2>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Gestión de nuevas solicitudes de músicos (Sección /unete)</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={filterRequestStatus} 
                onChange={(e) => setFilterRequestStatus(e.target.value)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--clr-border)' }}
              >
                <option value="Pendiente">Solo Pendientes</option>
                <option value="Evaluando">En Evaluación</option>
                <option value="Aceptada">Aceptadas</option>
                <option value="Rechazada">Rechazadas</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {joinRequests
                .filter(r => filterRequestStatus === 'all' || r.status === filterRequestStatus)
                .map(r => (
                  <div key={r.id} className="request-card-responsive">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--clr-navy)' }}>{r.name} {r.surname}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        textTransform: 'uppercase', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        background: r.status === 'Pendiente' ? 'var(--clr-primary-lt)' : 
                                   (r.status === 'Evaluando' ? '#fef3c7' : 
                                   (r.status === 'Aceptada' ? 'var(--clr-success-lt)' : 'var(--clr-danger-lt)')), 
                        color: r.status === 'Pendiente' ? 'var(--clr-primary)' : 
                               (r.status === 'Evaluando' ? '#d97706' : 
                               (r.status === 'Aceptada' ? 'var(--clr-success)' : 'var(--clr-danger)')) 
                      }}>
                        {r.status === 'Evaluando' ? '🔍 Evaluando' : r.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--clr-text-muted)', display: 'flex', gap: '1rem' }}>
                      <span>📧 {r.email}</span>
                      <span>📞 {r.phone}</span>
                    </p>
                    <div style={{ marginTop: '0.8rem', padding: '1rem', background: 'var(--clr-light)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--clr-navy-mid)', border: '1px solid #e1e8ed' }}>
                      <strong>Experiencia:</strong> {r.experience || "No especificada"}
                    </div>
                  </div>
                    <div className="request-interest-info">
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-gold)', fontWeight: 800, textTransform: 'uppercase' }}>Interesado en:</p>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--clr-navy)' }}>{r.group}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{r.instrument}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#999' }}>Recibida: {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                    <div className="request-actions-area">
                    {(r.status === 'Pendiente' || r.status === 'Evaluando') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button 
                          onClick={() => updateJoinRequestStatus(r.id, 'Aceptada', r.name, r.surname, r.email)}
                          className="btn-main-admin"
                          style={{ fontSize: '0.75rem', background: 'var(--clr-success)', border: 'none', padding: '0.6rem' }}
                        >
                          Aceptar y Enviar Email ✅
                        </button>
                        <button 
                          onClick={() => updateJoinRequestStatus(r.id, 'Aceptada', r.name, r.surname)}
                          className="btn-main-admin"
                          style={{ fontSize: '0.75rem', background: 'var(--clr-navy)', border: 'none', padding: '0.6rem' }}
                        >
                          Aceptar y ver link 🔗
                        </button>
                      </div>
                    )}
                    {r.status === 'Pendiente' && (
                      <button 
                        onClick={() => updateJoinRequestStatus(r.id, 'Evaluando')}
                        className="btn-onboarding-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.6rem', borderColor: '#d97706', color: '#d97706' }}
                      >
                        Pasar a Evaluación 🔍
                      </button>
                    )}
                    {(r.status === 'Pendiente' || r.status === 'Evaluando') && (
                      <button 
                        onClick={() => updateJoinRequestStatus(r.id, 'Rechazada')}
                        className="btn-onboarding-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.6rem' }}
                      >
                        Rechazar ❌
                      </button>
                    )}
                    <button 
                      onClick={() => deleteJoinRequest(r.id)}
                      style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', opacity: 0.7 }}
                    >
                      🗑️ Eliminar físicamente
                    </button>
                  </div>
                </div>
              ))}

            {joinRequests.filter(r => filterRequestStatus === 'all' || r.status === filterRequestStatus).length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--clr-light)', borderRadius: '12px', border: '1px dashed var(--clr-border)', color: 'var(--clr-text-muted)' }}>
                No hay solicitudes {filterRequestStatus !== 'all' ? `con estado '${filterRequestStatus}'` : ""} en este momento.
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
