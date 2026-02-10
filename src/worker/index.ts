import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";

// -----------------------------------------------------------------------
// 1. MODIFICAÇÃO NAS IMPORTAÇÕES (COMENTAMOS O ORIGINAL)
// -----------------------------------------------------------------------
import {
  // exchangeCodeForSessionToken, <--- NÃO PRECISA MAIS
  // getOAuthRedirectUrl,         <--- NÃO PRECISA MAIS
  // authMiddleware,              <--- NÃO PRECISA MAIS (VAMOS CRIAR UM FALSO)
  // deleteSession,               <--- NÃO PRECISA MAIS
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";


// -----------------------------------------------------------------------
// 2. CRIAMOS O MIDDLEWARE FALSO (O "CRACHÁ VIP")
// -----------------------------------------------------------------------
// Esse código intercepta todas as chamadas e diz: "É o Fabiano, pode passar!"
const authMiddleware = async (c: any, next: any) => {
  c.set("user", {
    id: "user_bypass_local_123",
    email: "fabianoeyes18@gmail.com", // OBRIGATÓRIO: Email do Super Admin
    google_user_data: {
      name: "Fabiano (Modo Local)",
      picture: "https://ui-avatars.com/api/?name=Fabiano+Admin&background=0D8ABC&color=fff"
    }
  });
  await next();
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Ajuste para sua porta local
  credentials: true,
}));

// ============================================
// AUTH ENDPOINTS (MODO BYPASS / SEM API KEY)
// ============================================

// Login: Pula o Google e manda o frontend logar direto
app.get("/api/oauth/google/redirect_url", async (c) => {
  console.log("🚀 BYPASS: Pulando autenticação real (Redirecionando...)");
  return c.json({ 
    // Manda o front direto para a tela de 'sucesso'
    redirectUrl: "http://localhost:5173/auth/callback?code=CODIGO_FALSO_BYPASS" 
  }, 200);
});

// Sessão: Cria um cookie falso só para o frontend ficar feliz
app.post("/api/sessions", async (c) => {
  console.log("🚀 BYPASS: Criando sessão falsa");
  
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "token_falso_desenvolvimento", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: false, // Importante: false para localhost
    maxAge: 60 * 60 * 24,
  });

  return c.json({ success: true }, 200);
});

// Logout: Apenas limpa o cookie falso
app.get("/api/logout", async (c) => {
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true, path: "/", sameSite: "Lax", secure: false, maxAge: 0,
  });
  return c.json({ success: true }, 200);
});

// ============================================
// DAQUI PRA BAIXO O CÓDIGO CONTINUA IGUAL...
// ============================================

app.get("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  if (!mochaUser) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const SUPER_ADMIN_EMAIL = 'fabianoeyes18@gmail.com';
  const isSuperAdmin = mochaUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const { results } = await c.env.DB.prepare(`
    SELECT au.*, r.name as role_name, r.color as role_color
    FROM app_users au
    LEFT JOIN roles r ON au.role_id = r.id
    WHERE au.mocha_user_id = ?
  `).bind(mochaUser.id).all();

  let appUser = results[0];

  if (!appUser) {
    const { results: authorizedUser } = await c.env.DB.prepare(`
      SELECT au.*, r.name as role_name, r.color as role_color
      FROM app_users au
      LEFT JOIN roles r ON au.role_id = r.id
      WHERE LOWER(au.email) = LOWER(?)
    `).bind(mochaUser.email).all();

    if (authorizedUser.length > 0) {
      // User was pre-authorized by admin - link their mocha account
      await c.env.DB.prepare(`
        UPDATE app_users 
        SET mocha_user_id = ?, 
            name = COALESCE(name, ?),
            avatar_url = ?,
            status = 'active',
            last_active_at = CURRENT_TIMESTAMP, 
            login_count = login_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(email) = LOWER(?)
      `).bind(
        mochaUser.id,
        mochaUser.google_user_data?.name || mochaUser.email.split('@')[0],
        mochaUser.google_user_data?.picture || null,
        mochaUser.email
      ).run();

      // Fetch the updated user
      const { results: updatedUser } = await c.env.DB.prepare(`
        SELECT au.*, r.name as role_name, r.color as role_color
        FROM app_users au
        LEFT JOIN roles r ON au.role_id = r.id
        WHERE au.mocha_user_id = ?
      `).bind(mochaUser.id).all();
      appUser = updatedUser[0];

      // Log the action
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (?, 'user_first_login', 'app_users', ?, ?)
      `).bind((appUser as any).id, (appUser as any).id, JSON.stringify({ email: mochaUser.email })).run();
    } else if (isSuperAdmin) {
      // Super admin (owner) - create if doesn't exist
      await c.env.DB.prepare(`
        INSERT INTO app_users (mocha_user_id, email, name, avatar_url, role_id, is_owner, status, last_active_at, login_count)
        VALUES (?, ?, ?, ?, 1, 1, 'active', CURRENT_TIMESTAMP, 1)
      `).bind(
        mochaUser.id,
        mochaUser.email,
        mochaUser.google_user_data?.name || mochaUser.email.split('@')[0],
        mochaUser.google_user_data?.picture || null
      ).run();

      // Fetch the newly created user
      const { results: newUser } = await c.env.DB.prepare(`
        SELECT au.*, r.name as role_name, r.color as role_color
        FROM app_users au
        LEFT JOIN roles r ON au.role_id = r.id
        WHERE au.mocha_user_id = ?
      `).bind(mochaUser.id).all();
      appUser = newUser[0];

      // Log the action
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (?, 'owner_created', 'app_users', ?, ?)
      `).bind((appUser as any).id, (appUser as any).id, JSON.stringify({ email: mochaUser.email, is_owner: true })).run();
    } else {
      // Email NOT authorized - deny access
      return c.json({ 
        error: "Acesso não autorizado. Seu email não está cadastrado no sistema. Entre em contato com o administrador.",
        unauthorized: true 
      }, 403);
    }
  } else {
    // Update last active and login count
    await c.env.DB.prepare(`
      UPDATE app_users 
      SET last_active_at = CURRENT_TIMESTAMP, login_count = login_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE mocha_user_id = ?
    `).bind(mochaUser.id).run();
  }

  // Get user permissions
  const { results: permissions } = await c.env.DB.prepare(`
    SELECT p.code FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).bind((appUser as any).role_id).all();

  return c.json({
    ...mochaUser,
    appUser: {
      ...appUser,
      is_owner: Boolean((appUser as any).is_owner),
      permissions: permissions.map((p: any) => p.code)
    }
  });
});

// Logout
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============================================
// USERS MANAGEMENT ENDPOINTS
// ============================================

// List all users
app.get("/api/admin/users", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT au.*, r.name as role_name, r.color as role_color
    FROM app_users au
    LEFT JOIN roles r ON au.role_id = r.id
    ORDER BY au.created_at DESC
  `).all();

  return c.json(results);
});

// Invite a new user
app.post("/api/admin/users/invite", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { email, role_id, name } = body;

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  // Check if user already exists
  const { results: existing } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE email = ?"
  ).bind(email).all();

  if (existing.length > 0) {
    return c.json({ error: "User with this email already exists" }, 400);
  }

  // Get the current app user id for invited_by
  const { results: currentAppUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  // Create pending user
  const result = await c.env.DB.prepare(`
    INSERT INTO app_users (email, name, role_id, status, invited_by_id, invited_at)
    VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
  `).bind(email, name || email.split('@')[0], role_id || 4, (currentAppUser[0] as any)?.id || null).run();

  // Log the action
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'user_invited', 'app_users', ?, ?)
  `).bind((currentAppUser[0] as any)?.id, result.meta.last_row_id, JSON.stringify({ email, role_id })).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update user
app.put("/api/admin/users/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const userId = c.req.param("id");
  const body = await c.req.json();
  const { name, role_id, status, is_mfa_enabled } = body;

  // Get old values for audit log
  const { results: oldUser } = await c.env.DB.prepare(
    "SELECT * FROM app_users WHERE id = ?"
  ).bind(userId).all();

  if (oldUser.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE app_users 
    SET name = COALESCE(?, name),
        role_id = COALESCE(?, role_id),
        status = COALESCE(?, status),
        is_mfa_enabled = COALESCE(?, is_mfa_enabled),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, role_id, status, is_mfa_enabled, userId).run();

  // Get current app user for audit
  const { results: currentAppUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  // Log the action
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'user_updated', 'app_users', ?, ?, ?)
  `).bind(
    (currentAppUser[0] as any)?.id,
    userId,
    JSON.stringify(oldUser[0]),
    JSON.stringify({ name, role_id, status, is_mfa_enabled })
  ).run();

  return c.json({ success: true });
});

// Create admin invite with token (for WhatsApp sharing)
app.post("/api/admin/invite", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { email, name, role_id, corporate_email } = body;

  // Get current app user
  const { results: currentAppUser } = await c.env.DB.prepare(`
    SELECT id, is_owner, role_id FROM app_users WHERE mocha_user_id = ?
  `).bind(currentUser!.id).all();

  const appUserData = currentAppUser[0] as any;
   
  // SQLite stores booleans as 0/1, so we need to check explicitly
  const isOwner = appUserData?.is_owner === 1 || appUserData?.is_owner === true;
  const isAdmin = appUserData?.role_id === 1;

  // Owner or Admin can invite other admins (role_id = 1)
  if (role_id === 1 && !isOwner && !isAdmin) {
    return c.json({ error: "Apenas o proprietário ou administradores podem convidar administradores" }, 403);
  }

  // Admins and owners can invite any other role
  if (!isAdmin && !isOwner) {
    return c.json({ error: "Você não tem permissão para convidar usuários" }, 403);
  }

  // Check if user already exists
  if (email) {
    const { results: existing } = await c.env.DB.prepare(
      "SELECT id FROM app_users WHERE email = ?"
    ).bind(email).all();

    if (existing.length > 0) {
      return c.json({ error: "Usuário com este email já existe" }, 400);
    }
  }

  // Generate a secure token
  const token = Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');

  // Token expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // If corporate_email is provided, require validation
  const requiresValidation = corporate_email ? 1 : 0;

  await c.env.DB.prepare(`
    INSERT INTO invite_tokens (token, email, name, role_id, invited_by_id, expires_at, corporate_email, requires_validation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(token, email || null, name || null, role_id || 4, appUserData?.id, expiresAt, corporate_email || null, requiresValidation).run();

  // Generate invite link
  const baseUrl = new URL(c.req.url).origin;
  const inviteLink = `${baseUrl}/login?invite=${token}`;

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'invite_created', 'invite_tokens', ?, ?)
  `).bind(appUserData?.id, token, JSON.stringify({ email, role_id })).run();

  return c.json({ 
    success: true, 
    token, 
    invite_link: inviteLink, 
    expires_at: expiresAt
  });
});

// Validate invite token
app.get("/api/invite/:token", async (c) => {
  const token = c.req.param("token");

  const { results } = await c.env.DB.prepare(`
    SELECT it.*, r.name as role_name, au.name as invited_by_name
    FROM invite_tokens it
    LEFT JOIN roles r ON it.role_id = r.id
    LEFT JOIN app_users au ON it.invited_by_id = au.id
    WHERE it.token = ? AND it.used_at IS NULL AND it.expires_at > CURRENT_TIMESTAMP
  `).bind(token).all();

  if (results.length === 0) {
    return c.json({ error: "Convite inválido ou expirado" }, 404);
  }

  const invite = results[0] as any;
  return c.json({
    valid: true,
    email: invite.email,
    name: invite.name,
    role_name: invite.role_name,
    invited_by_name: invite.invited_by_name,
    expires_at: invite.expires_at,
    corporate_email: invite.corporate_email,
    requires_validation: Boolean(invite.requires_validation)
  });
});

// Accept invite (when user logs in with invite token)
app.post("/api/invite/:token/accept", authMiddleware, async (c) => {
  const token = c.req.param("token");
  const mochaUser = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const { validated_corporate_email } = body;

  // Validate token
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM invite_tokens 
    WHERE token = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
  `).bind(token).all();

  if (results.length === 0) {
    return c.json({ error: "Convite inválido ou expirado" }, 404);
  }

  const invite = results[0] as any;

  // Check if email matches (if email was specified in invite)
  if (invite.email && invite.email.toLowerCase() !== mochaUser!.email.toLowerCase()) {
    return c.json({ error: "Este convite foi enviado para outro email" }, 403);
  }

  // Check if corporate email validation is required
  if (invite.requires_validation && invite.corporate_email) {
    if (!validated_corporate_email) {
      return c.json({ 
        error: "Validação de email corporativo necessária",
        requires_validation: true,
        corporate_email_hint: invite.corporate_email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }, 400);
    }
    // Validate the corporate email matches (case insensitive)
    if (validated_corporate_email.toLowerCase().trim() !== invite.corporate_email.toLowerCase().trim()) {
      return c.json({ error: "Email corporativo não confere com o convite" }, 403);
    }
  }

  // Check if user already exists
  const { results: existingUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(mochaUser!.id).all();

  const corporateEmail = invite.corporate_email || null;

  if (existingUser.length > 0) {
    // User already exists, just update their role if needed
    await c.env.DB.prepare(`
      UPDATE app_users SET role_id = ?, invited_by_id = ?, invited_at = CURRENT_TIMESTAMP, corporate_email = COALESCE(?, corporate_email), updated_at = CURRENT_TIMESTAMP
      WHERE mocha_user_id = ?
    `).bind(invite.role_id, invite.invited_by_id, corporateEmail, mochaUser!.id).run();
  } else {
    // Create new user with invited role
    await c.env.DB.prepare(`
      INSERT INTO app_users (mocha_user_id, email, name, avatar_url, role_id, status, invited_by_id, invited_at, last_active_at, login_count, corporate_email)
      VALUES (?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?)
    `).bind(
      mochaUser!.id,
      mochaUser!.email,
      invite.name || mochaUser!.google_user_data?.name || mochaUser!.email.split('@')[0],
      mochaUser!.google_user_data?.picture || null,
      invite.role_id,
      invite.invited_by_id,
      corporateEmail
    ).run();
  }

  // Mark token as used
  await c.env.DB.prepare(`
    UPDATE invite_tokens SET used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE token = ?
  `).bind(token).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'invite_accepted', 'invite_tokens', ?, ?)
  `).bind(invite.invited_by_id, token, JSON.stringify({ email: mochaUser!.email, corporate_email: corporateEmail })).run();

  return c.json({ success: true });
});

// List pending invites
app.get("/api/admin/invites", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT it.*, r.name as role_name, au.name as invited_by_name
    FROM invite_tokens it
    LEFT JOIN roles r ON it.role_id = r.id
    LEFT JOIN app_users au ON it.invited_by_id = au.id
    WHERE it.used_at IS NULL
    ORDER BY it.created_at DESC
  `).all();

  return c.json(results);
});

// Revoke invite
app.delete("/api/admin/invites/:token", authMiddleware, async (c) => {
  const token = c.req.param("token");

  await c.env.DB.prepare(
    "DELETE FROM invite_tokens WHERE token = ?"
  ).bind(token).run();

  return c.json({ success: true });
});

// Delete user
app.delete("/api/admin/users/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const userId = c.req.param("id");

  // Get current app user
  const { results: currentAppUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  // Can't delete yourself
  if ((currentAppUser[0] as any)?.id === parseInt(userId)) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  // Get user for audit log
  const { results: userToDelete } = await c.env.DB.prepare(
    "SELECT * FROM app_users WHERE id = ?"
  ).bind(userId).all();

  if (userToDelete.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM app_users WHERE id = ?").bind(userId).run();

  // Log the action
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (?, 'user_deleted', 'app_users', ?, ?)
  `).bind((currentAppUser[0] as any)?.id, userId, JSON.stringify(userToDelete[0])).run();

  return c.json({ success: true });
});

// ============================================
// ROLES & PERMISSIONS ENDPOINTS
// ============================================

// List all roles
app.get("/api/admin/roles", authMiddleware, async (c) => {
  const { results: roles } = await c.env.DB.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM app_users WHERE role_id = r.id) as user_count
    FROM roles r
    ORDER BY r.id
  `).all();

  // Get permissions for each role
  for (const role of roles as any[]) {
    const { results: perms } = await c.env.DB.prepare(`
      SELECT p.code FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).bind(role.id).all();
    role.permissions = perms.map((p: any) => p.code);
  }

  return c.json(roles);
});

// Create role
app.post("/api/admin/roles", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, description, color, permissions } = body;

  const result = await c.env.DB.prepare(`
    INSERT INTO roles (name, description, color, is_system)
    VALUES (?, ?, ?, 0)
  `).bind(name, description, color || 'gray').run();

  const roleId = result.meta.last_row_id;

  // Add permissions
  if (permissions && permissions.length > 0) {
    for (const permCode of permissions) {
      await c.env.DB.prepare(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ?, id FROM permissions WHERE code = ?
      `).bind(roleId, permCode).run();
    }
  }

  return c.json({ success: true, id: roleId });
});

// Update role
app.put("/api/admin/roles/:id", authMiddleware, async (c) => {
  const roleId = c.req.param("id");
  const body = await c.req.json();
  const { name, description, color, permissions } = body;

  // Check if system role
  const { results: role } = await c.env.DB.prepare(
    "SELECT is_system FROM roles WHERE id = ?"
  ).bind(roleId).all();

  if ((role[0] as any)?.is_system) {
    return c.json({ error: "Cannot modify system roles" }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE roles 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, description, color, roleId).run();

  // Update permissions if provided
  if (permissions) {
    await c.env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?").bind(roleId).run();
    for (const permCode of permissions) {
      await c.env.DB.prepare(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ?, id FROM permissions WHERE code = ?
      `).bind(roleId, permCode).run();
    }
  }

  return c.json({ success: true });
});

// Delete role
app.delete("/api/admin/roles/:id", authMiddleware, async (c) => {
  const roleId = c.req.param("id");

  // Check if system role
  const { results: role } = await c.env.DB.prepare(
    "SELECT is_system FROM roles WHERE id = ?"
  ).bind(roleId).all();

  if ((role[0] as any)?.is_system) {
    return c.json({ error: "Cannot delete system roles" }, 400);
  }

  // Check if role has users
  const { results: users } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM app_users WHERE role_id = ?"
  ).bind(roleId).all();

  if ((users[0] as any).count > 0) {
    return c.json({ error: "Cannot delete role with assigned users" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?").bind(roleId).run();
  await c.env.DB.prepare("DELETE FROM roles WHERE id = ?").bind(roleId).run();

  return c.json({ success: true });
});

// List all permissions
app.get("/api/admin/permissions", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM permissions ORDER BY group_name, code
  `).all();

  return c.json(results);
});

// ============================================
// CASES ENDPOINTS
// ============================================

// List all cases
app.get("/api/cases", authMiddleware, async (c) => {
  const status = c.req.query("status");
  const search = c.req.query("search");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = "SELECT * FROM cases WHERE 1=1";
  const params: any[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (search) {
    query += " AND (customer_name LIKE ? OR case_number LIKE ? OR contract_id LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM cases WHERE 1=1";
  const countParams: any[] = [];
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }
  if (search) {
    countQuery += " AND (customer_name LIKE ? OR case_number LIKE ? OR contract_id LIKE ?)";
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all();
  const total = (countResult[0] as any).total;

  return c.json({ cases: results, total });
});

// Get case stats
app.get("/api/cases/stats", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(total_debt) as total_debt,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
      SUM(CASE WHEN status = 'negotiating' THEN 1 ELSE 0 END) as negotiating_count,
      SUM(CASE WHEN status = 'promised' THEN 1 ELSE 0 END) as promised_count,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_count,
      SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_count,
      SUM(CASE WHEN has_consent = 0 THEN 1 ELSE 0 END) as without_consent_count
    FROM cases
  `).all();

  return c.json(results[0]);
});

// Get single case with details
app.get("/api/cases/:id", authMiddleware, async (c) => {
  const caseId = c.req.param("id");
   
  // Support both numeric ID and case_number
  const isNumeric = /^\d+$/.test(caseId);
  const query = isNumeric 
    ? "SELECT * FROM cases WHERE id = ?"
    : "SELECT * FROM cases WHERE case_number = ?";
   
  const { results } = await c.env.DB.prepare(query).bind(caseId).all();

  if (results.length === 0) {
    return c.json({ error: "Case not found" }, 404);
  }

  const caseData = results[0] as any;

  // Get timeline events
  const { results: timeline } = await c.env.DB.prepare(`
    SELECT * FROM case_timeline WHERE case_id = ? ORDER BY created_at DESC
  `).bind(caseData.id).all();

  // Get installments
  const { results: installments } = await c.env.DB.prepare(`
    SELECT * FROM case_installments WHERE case_id = ? ORDER BY installment_number
  `).bind(caseData.id).all();

  return c.json({ ...caseData, timeline, installments });
});

// Create new case
app.post("/api/cases", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();

  // Generate case number
  const { results: lastCase } = await c.env.DB.prepare(
    "SELECT case_number FROM cases ORDER BY id DESC LIMIT 1"
  ).all();
   
  let nextNumber = 1;
  if (lastCase.length > 0) {
    const lastNum = parseInt((lastCase[0] as any).case_number.replace('CASE-', ''));
    nextNumber = lastNum + 1;
  }
  const caseNumber = `CASE-${String(nextNumber).padStart(3, '0')}`;

  const result = await c.env.DB.prepare(`
    INSERT INTO cases (
      case_number, customer_name, customer_document, customer_phone, customer_email,
      contract_id, contract_type, total_debt, days_overdue, status,
      last_contact_channel, assigned_operator_name, risk_score,
      has_consent, installments_overdue, total_installments, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    caseNumber,
    body.customer_name,
    body.customer_document || null,
    body.customer_phone || null,
    body.customer_email || null,
    body.contract_id || null,
    body.contract_type || null,
    body.total_debt || 0,
    body.days_overdue || 0,
    body.status || 'new',
    body.last_contact_channel || null,
    body.assigned_operator_name || null,
    body.risk_score || 50,
    body.has_consent ? 1 : 0,
    body.installments_overdue || 0,
    body.total_installments || 1,
    body.notes || null
  ).run();

  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'case_created', 'cases', ?, ?)
  `).bind((appUser[0] as any)?.id, result.meta.last_row_id, JSON.stringify({ case_number: caseNumber, customer_name: body.customer_name })).run();

  // Add timeline entry
  await c.env.DB.prepare(`
    INSERT INTO case_timeline (case_id, event_type, title, description, user_name)
    VALUES (?, 'system', 'Caso Criado', 'Caso criado no sistema', ?)
  `).bind(result.meta.last_row_id, currentUser?.google_user_data?.name || 'Sistema').run();

  return c.json({ success: true, id: result.meta.last_row_id, case_number: caseNumber });
});

// Update case
app.put("/api/cases/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const caseId = c.req.param("id");
  const body = await c.req.json();

  // Get old case for audit
  const { results: oldCase } = await c.env.DB.prepare(
    "SELECT * FROM cases WHERE id = ?"
  ).bind(caseId).all();

  if (oldCase.length === 0) {
    return c.json({ error: "Case not found" }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE cases SET
      customer_name = COALESCE(?, customer_name),
      customer_document = COALESCE(?, customer_document),
      customer_phone = COALESCE(?, customer_phone),
      customer_email = COALESCE(?, customer_email),
      contract_id = COALESCE(?, contract_id),
      contract_type = COALESCE(?, contract_type),
      total_debt = COALESCE(?, total_debt),
      days_overdue = COALESCE(?, days_overdue),
      status = COALESCE(?, status),
      last_contact_channel = COALESCE(?, last_contact_channel),
      last_contact_at = COALESCE(?, last_contact_at),
      next_action_at = COALESCE(?, next_action_at),
      assigned_operator_name = COALESCE(?, assigned_operator_name),
      risk_score = COALESCE(?, risk_score),
      has_consent = COALESCE(?, has_consent),
      installments_overdue = COALESCE(?, installments_overdue),
      total_installments = COALESCE(?, total_installments),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.customer_name,
    body.customer_document,
    body.customer_phone,
    body.customer_email,
    body.contract_id,
    body.contract_type,
    body.total_debt,
    body.days_overdue,
    body.status,
    body.last_contact_channel,
    body.last_contact_at,
    body.next_action_at,
    body.assigned_operator_name,
    body.risk_score,
    body.has_consent !== undefined ? (body.has_consent ? 1 : 0) : null,
    body.installments_overdue,
    body.total_installments,
    body.notes,
    caseId
  ).run();

  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'case_updated', 'cases', ?, ?, ?)
  `).bind((appUser[0] as any)?.id, caseId, JSON.stringify(oldCase[0]), JSON.stringify(body)).run();

  // Add timeline entry for status changes
  if (body.status && body.status !== (oldCase[0] as any).status) {
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, user_name)
      VALUES (?, 'status', 'Status Alterado', ?, ?)
    `).bind(caseId, `Status alterado de "${(oldCase[0] as any).status}" para "${body.status}"`, currentUser?.google_user_data?.name || 'Sistema').run();
  }

  return c.json({ success: true });
});

// Delete case
app.delete("/api/cases/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const caseId = c.req.param("id");

  const { results: caseToDelete } = await c.env.DB.prepare(
    "SELECT * FROM cases WHERE id = ?"
  ).bind(caseId).all();

  if (caseToDelete.length === 0) {
    return c.json({ error: "Case not found" }, 404);
  }

  // Delete related records first
  await c.env.DB.prepare("DELETE FROM case_timeline WHERE case_id = ?").bind(caseId).run();
  await c.env.DB.prepare("DELETE FROM case_installments WHERE case_id = ?").bind(caseId).run();
  await c.env.DB.prepare("DELETE FROM cases WHERE id = ?").bind(caseId).run();

  // Audit log
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (?, 'case_deleted', 'cases', ?, ?)
  `).bind((appUser[0] as any)?.id, caseId, JSON.stringify(caseToDelete[0])).run();

  return c.json({ success: true });
});

// Add timeline event
app.post("/api/cases/:id/timeline", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const caseId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(`
    INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    caseId,
    body.event_type || 'note',
    body.title,
    body.description || null,
    body.channel || null,
    currentUser?.google_user_data?.name || 'Sistema',
    body.metadata ? JSON.stringify(body.metadata) : null
  ).run();

  // Update case last_contact if it's a contact event
  if (body.event_type === 'contact' && body.channel) {
    await c.env.DB.prepare(`
      UPDATE cases SET last_contact_channel = ?, last_contact_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.channel, caseId).run();
  }

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update installment
app.put("/api/cases/:caseId/installments/:id", authMiddleware, async (c) => {
  const installmentId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE case_installments SET
      paid_amount = COALESCE(?, paid_amount),
      status = COALESCE(?, status),
      paid_at = COALESCE(?, paid_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(body.paid_amount, body.status, body.paid_at, installmentId).run();

  return c.json({ success: true });
});

// ============================================
// JOURNEYS ENDPOINTS
// ============================================

// List all journeys
app.get("/api/journeys", authMiddleware, async (c) => {
  const { results: journeys } = await c.env.DB.prepare(`
    SELECT * FROM journeys ORDER BY created_at DESC
  `).all();

  // Get steps for each journey
  for (const journey of journeys as any[]) {
    const { results: steps } = await c.env.DB.prepare(`
      SELECT * FROM journey_steps WHERE journey_id = ? ORDER BY step_order
    `).bind(journey.id).all();
    journey.steps = steps;
  }

  return c.json(journeys);
});

// Get single journey
app.get("/api/journeys/:id", authMiddleware, async (c) => {
  const journeyId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM journeys WHERE id = ?"
  ).bind(journeyId).all();

  if (results.length === 0) {
    return c.json({ error: "Journey not found" }, 404);
  }

  const journey = results[0] as any;

  const { results: steps } = await c.env.DB.prepare(`
    SELECT * FROM journey_steps WHERE journey_id = ? ORDER BY step_order
  `).bind(journeyId).all();

  journey.steps = steps;

  return c.json(journey);
});

// Create journey
app.post("/api/journeys", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();

  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  const result = await c.env.DB.prepare(`
    INSERT INTO journeys (name, description, status, trigger_conditions, created_by_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    body.name,
    body.description || null,
    body.status || 'draft',
    body.trigger_conditions ? JSON.stringify(body.trigger_conditions) : null,
    (appUser[0] as any)?.id || null
  ).run();

  const journeyId = result.meta.last_row_id;

  // Add steps if provided
  if (body.steps && body.steps.length > 0) {
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      await c.env.DB.prepare(`
        INSERT INTO journey_steps (journey_id, step_order, day_offset, channel, action_type, action_title, template_content, conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        journeyId,
        i + 1,
        step.day_offset || step.day || 0,
        step.channel,
        step.action_type || 'message',
        step.action_title || step.action,
        step.template_content || null,
        step.conditions ? JSON.stringify(step.conditions) : null
      ).run();
    }
  }

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'journey_created', 'journeys', ?, ?)
  `).bind((appUser[0] as any)?.id, journeyId, JSON.stringify({ name: body.name })).run();

  return c.json({ success: true, id: journeyId });
});

// Update journey
app.put("/api/journeys/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const journeyId = c.req.param("id");
  const body = await c.req.json();

  const { results: oldJourney } = await c.env.DB.prepare(
    "SELECT * FROM journeys WHERE id = ?"
  ).bind(journeyId).all();

  if (oldJourney.length === 0) {
    return c.json({ error: "Journey not found" }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE journeys SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      trigger_conditions = COALESCE(?, trigger_conditions),
      cases_active = COALESCE(?, cases_active),
      conversion_rate = COALESCE(?, conversion_rate),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.description,
    body.status,
    body.trigger_conditions ? JSON.stringify(body.trigger_conditions) : null,
    body.cases_active,
    body.conversion_rate,
    journeyId
  ).run();

  // Update steps if provided
  if (body.steps) {
    // Delete existing steps
    await c.env.DB.prepare("DELETE FROM journey_steps WHERE journey_id = ?").bind(journeyId).run();
     
    // Add new steps
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      await c.env.DB.prepare(`
        INSERT INTO journey_steps (journey_id, step_order, day_offset, channel, action_
        type, action_title, template_content, conditions, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        journeyId,
        i + 1,
        step.day_offset || step.day || 0,
        step.channel,
        step.action_type || 'message',
        step.action_title || step.action,
        step.template_content || null,
        step.conditions ? JSON.stringify(step.conditions) : null,
        step.is_active !== undefined ? (step.is_active ? 1 : 0) : 1
      ).run();
    }
  }

  // Audit log
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'journey_updated', 'journeys', ?, ?, ?)
  `).bind((appUser[0] as any)?.id, journeyId, JSON.stringify(oldJourney[0]), JSON.stringify(body)).run();

  return c.json({ success: true });
});

// Delete journey
app.delete("/api/journeys/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const journeyId = c.req.param("id");

  const { results: journey } = await c.env.DB.prepare(
    "SELECT * FROM journeys WHERE id = ?"
  ).bind(journeyId).all();

  if (journey.length === 0) {
    return c.json({ error: "Journey not found" }, 404);
  }

  // Delete steps first
  await c.env.DB.prepare("DELETE FROM journey_steps WHERE journey_id = ?").bind(journeyId).run();
  await c.env.DB.prepare("DELETE FROM journeys WHERE id = ?").bind(journeyId).run();

  // Audit log
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (?, 'journey_deleted', 'journeys', ?, ?)
  `).bind((appUser[0] as any)?.id, journeyId, JSON.stringify(journey[0])).run();

  return c.json({ success: true });
});

// Toggle journey status
app.post("/api/journeys/:id/toggle", authMiddleware, async (c) => {
  const journeyId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT status FROM journeys WHERE id = ?"
  ).bind(journeyId).all();

  if (results.length === 0) {
    return c.json({ error: "Journey not found" }, 404);
  }

  const currentStatus = (results[0] as any).status;
  const newStatus = currentStatus === 'active' ? 'paused' : 'active';

  await c.env.DB.prepare(`
    UPDATE journeys SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, journeyId).run();

  return c.json({ success: true, status: newStatus });
});

// ============================================
// DASHBOARD STATS ENDPOINT
// ============================================

app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  // Get case statistics
  const { results: caseStats } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(total_debt) as total_portfolio,
      SUM(CASE WHEN days_overdue > 0 THEN total_debt ELSE 0 END) as default_amount,
      SUM(CASE WHEN status = 'paid' THEN total_debt ELSE 0 END) as recovered_amount,
      SUM(CASE WHEN status = 'promised' THEN 1 ELSE 0 END) as payment_promises,
      SUM(CASE WHEN last_contact_at IS NOT NULL THEN 1 ELSE 0 END) as contacted_count
    FROM cases
  `).all();

  const stats = caseStats[0] as any;
   
  // Calculate rates
  const totalCases = stats.total_cases || 1;
  const contactRate = stats.contacted_count / totalCases;
  const conversionRate = stats.recovered_amount / (stats.total_portfolio || 1);

  // Get cases by status for funnel
  const { results: statusCounts } = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count, SUM(total_debt) as debt
    FROM cases GROUP BY status
  `).all();

  // Get recent activity (last 7 days)
  const { results: recentActivity } = await c.env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as events
    FROM case_timeline
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  // Get recovery by channel
  const { results: channelStats } = await c.env.DB.prepare(`
    SELECT last_contact_channel as channel, COUNT(*) as count
    FROM cases WHERE status = 'paid' AND last_contact_channel IS NOT NULL
    GROUP BY last_contact_channel
  `).all();

  return c.json({
    totalPortfolio: stats.total_portfolio || 0,
    defaultAmount: stats.default_amount || 0,
    recoveredAmount: stats.recovered_amount || 0,
    paymentPromises: stats.payment_promises || 0,
    contactRate: contactRate || 0,
    conversionRate: conversionRate || 0,
    totalCases: stats.total_cases || 0,
    slaCompliance: 0.92, // Mock for now
    statusCounts: statusCounts,
    recentActivity: recentActivity,
    channelStats: channelStats
  });
});

// ============================================
// IMPORT/EXPORT ENDPOINTS
// ============================================

// Export cases as CSV
app.get("/api/cases/export", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT case_number, customer_name, customer_document, customer_phone, customer_email,
           contract_id, contract_type, total_debt, days_overdue, status,
           last_contact_channel, assigned_operator_name, risk_score, has_consent,
           installments_overdue, total_installments, notes, created_at
    FROM cases ORDER BY created_at DESC
  `).all();

  // Generate CSV
  const headers = ['Número do Caso', 'Cliente', 'CPF/CNPJ', 'Telefone', 'Email', 
                   'Contrato', 'Tipo Contrato', 'Valor Dívida', 'Dias em Atraso', 'Status',
                   'Último Canal', 'Operador', 'Score Risco', 'Consentimento',
                   'Parcelas Atraso', 'Total Parcelas', 'Notas', 'Criado em'];
   
  const rows = (results as any[]).map(row => [
    row.case_number, row.customer_name, row.customer_document, row.customer_phone, row.customer_email,
    row.contract_id, row.contract_type, row.total_debt, row.days_overdue, row.status,
    row.last_contact_channel, row.assigned_operator_name, row.risk_score, row.has_consent ? 'Sim' : 'Não',
    row.installments_overdue, row.total_installments, row.notes, row.created_at
  ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="casos_export.csv"'
    }
  });
});

// Import cases from JSON
app.post("/api/cases/import", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { cases } = body;

  if (!cases || !Array.isArray(cases)) {
    return c.json({ error: "Invalid import data. Expected { cases: [...] }" }, 400);
  }

  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  let imported = 0;
  let errors: string[] = [];

  for (const caseData of cases) {
    try {
      // Generate case number
      const { results: lastCase } = await c.env.DB.prepare(
        "SELECT case_number FROM cases ORDER BY id DESC LIMIT 1"
      ).all();
       
      let nextNumber = 1;
      if (lastCase.length > 0) {
        const lastNum = parseInt((lastCase[0] as any).case_number.replace('CASE-', ''));
        nextNumber = lastNum + 1;
      }
      const caseNumber = `CASE-${String(nextNumber).padStart(3, '0')}`;

      await c.env.DB.prepare(`
        INSERT INTO cases (
          case_number, customer_name, customer_document, customer_phone, customer_email,
          contract_id, contract_type, total_debt, days_overdue, status,
          assigned_operator_name, risk_score, has_consent, installments_overdue, total_installments, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        caseNumber,
        caseData.customer_name || caseData.nome || 'Sem nome',
        caseData.customer_document || caseData.cpf || caseData.documento || null,
        caseData.customer_phone || caseData.telefone || null,
        caseData.customer_email || caseData.email || null,
        caseData.contract_id || caseData.contrato || null,
        caseData.contract_type || caseData.tipo_contrato || null,
        parseFloat(caseData.total_debt || caseData.valor || caseData.divida || 0),
        parseInt(caseData.days_overdue || caseData.dias_atraso || 0),
        caseData.status || 'new',
        caseData.assigned_operator_name || caseData.operador || null,
        parseInt(caseData.risk_score || 50),
        caseData.has_consent ? 1 : 0,
        parseInt(caseData.installments_overdue || caseData.parcelas_atraso || 0),
        parseInt(caseData.total_installments || caseData.total_parcelas || 1),
        caseData.notes || caseData.notas || null
      ).run();

      imported++;
    } catch (err: any) {
      errors.push(`Row ${imported + errors.length + 1}: ${err.message}`);
    }
  }

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'cases_imported', 'cases', ?, ?)
  `).bind((appUser[0] as any)?.id, null, JSON.stringify({ imported, errors: errors.length })).run();

  return c.json({ success: true, imported, errors });
});

// ============================================
// PAYMENTS ENDPOINTS (PIX & BOLETO - DEMO MODE)
// ============================================

// Helper functions for demo payment generation
function generatePixCode(amount: number, caseId: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `00020126580014BR.GOV.BCB.PIX0136${random}${timestamp}520400005303986540${amount.toFixed(2)}5802BR5913SOUL COLLECT6008SAO PAULO62070503***6304${caseId}`;
}

function generatePixQRData(pixCode: string): string {
  // Generate a simple QR code URL using a public QR code API (demo mode)
  const encoded = encodeURIComponent(pixCode);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

function generateBoletoBarcode(): string {
  const segments = [];
  for (let i = 0; i < 5; i++) {
    segments.push(Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
  }
  return `23793.${segments[0]} ${segments[1]}.${segments[2]} ${segments[3]}.${segments[4]} 1 ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

function generateBoletoLine(): string {
  const part1 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const part2 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const part3 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const part4 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const part5 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `23793.${part1} ${part2}.${part3} ${part4}.${part5} 1 ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
}

const DEMO_BANKS = ['Banco do Brasil', 'Itaú Unibanco', 'Bradesco', 'Santander', 'Caixa Econômica'];

// ============================================
// PAYMENTS ENDPOINTS (PIX & BOLETO)
// ============================================

app.post("/api/payments", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { case_id, amount, due_date, payment_type } = body;

  if (payment_type === "boleto") {
    const integration = await c.env.DB.prepare(`
      SELECT config, credentials FROM integrations 
      WHERE type = 'beta_erp' AND status = 'active' LIMIT 1
    `).first();

    const caseRecord = await c.env.DB.prepare(`
      SELECT customer_name, customer_document FROM cases WHERE id = ?
    `).bind(case_id).first();

    if (!integration || !caseRecord) {
      return c.json({ success: false, error: "Integração ou Caso não encontrado." }, 404);
    }

    const config = JSON.parse(integration.config as string);
    const creds = JSON.parse(integration.credentials as string);
    const targetUrl = `${config.base_url.split("/api")[0]}/api/ai/echo?db=beta`;

    try {
      const responseBeta = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": creds.api_key },
        body: JSON.stringify({
          sinal: "gerar_boleto",
          nome_completo: caseRecord.customer_name,
          documento: caseRecord.customer_document,
          valor_divida: amount,
          due_date: due_date, 
        }),
      });

      const odooText = await responseBeta.text(); 
      console.log("[SOULCOLLECT] Odoo raw status=", responseBeta.status); 
      console.log("[SOULCOLLECT] Odoo raw body=", odooText); 

      let odooData: any = null; 
      try {
        odooData = JSON.parse(odooText); 
      } catch (e) {
        return c.json(
          {
            success: false,
            error: "Odoo retornou resposta não-JSON",
            details: { status: responseBeta.status, body: odooText },
          },
          502
        );
      }

      if (odooData.invoice_found && odooData.boleto) {
        const b = odooData.boleto;

        return c.json({
          success: true,
          data: {
            valor: b.valor ?? amount,
            vencimento: b.vencimento ?? due_date,
            linha_digitavel: b.linha_digitavel ?? null,
            codigo_barras: b.codigo_barras ?? null,
            banco: "Itaú",
            itau: {
              id_boleto: b.id_boleto_itau ?? null,
              nosso_numero: b.nosso_numero ?? null,
              codigo_carteira: b.codigo_carteira ?? null,
            },
            invoice_id: odooData.invoice_id ?? null,
          },
        });
      }

      return c.json(
        {
          success: false,
          error: odooData.error || "Boleto não encontrado no Odoo.",
          details: odooData.details || null,
        },
        404
      );
    } catch (err: any) {
      return c.json({ success: false, error: "Erro na comunicação com o Odoo." }, 503);
    }
  }

  return c.json({ success: true, data: { valor: amount, vencimento: due_date } });
});


// List payments for a case
app.get("/api/cases/:id/payments", authMiddleware, async (c) => {
  const caseId = c.req.param("id");

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM payments WHERE case_id = ? ORDER BY created_at DESC
  `).bind(caseId).all();

  return c.json(results);
});

// Get single payment
app.get("/api/payments/:id", authMiddleware, async (c) => {
  const paymentId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM payments WHERE id = ?"
  ).bind(paymentId).all();

  if (results.length === 0) {
    return c.json({ error: "Payment not found" }, 404);
  }

  return c.json(results[0]);
});

// Update payment status (simulate payment confirmation in demo mode)
app.put("/api/payments/:id", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const paymentId = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;

  const { results: payment } = await c.env.DB.prepare(
    "SELECT * FROM payments WHERE id = ?"
  ).bind(paymentId).all();

  if (payment.length === 0) {
    return c.json({ error: "Payment not found" }, 404);
  }

  const paidAt = status === 'paid' ? new Date().toISOString() : null;

  await c.env.DB.prepare(`
    UPDATE payments SET status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status, paidAt, paymentId).run();

  // If paid, add timeline entry and potentially update case status
  if (status === 'paid') {
    const p = payment[0] as any;
     
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name)
      VALUES (?, 'payment', 'Pagamento Confirmado', ?, ?, ?)
    `).bind(
      p.case_id,
      `Pagamento de R$ ${p.amount.toFixed(2)} confirmado via ${p.payment_type.toUpperCase()}`,
      p.payment_type,
      currentUser?.google_user_data?.name || 'Sistema'
    ).run();
  }

  return c.json({ success: true });
});

// Simulate webhook callback (for demo testing)
app.post("/api/payments/:id/simulate-callback", authMiddleware, async (c) => {
  const paymentId = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;

  const { results: payment } = await c.env.DB.prepare(
    "SELECT * FROM payments WHERE id = ?"
  ).bind(paymentId).all();

  if (payment.length === 0) {
    return c.json({ error: "Payment not found" }, 404);
  }

  const p = payment[0] as any;
  const paidAt = status === 'paid' ? new Date().toISOString() : null;

  await c.env.DB.prepare(`
    UPDATE payments SET status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status, paidAt, paymentId).run();

  // Add timeline entry
  const statusLabels: Record<string, string> = {
    paid: 'Pagamento Confirmado',
    expired: 'Pagamento Expirado',
    cancelled: 'Pagamento Cancelado'
  };

  await c.env.DB.prepare(`
    INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name, metadata)
    VALUES (?, 'payment', ?, ?, ?, 'Webhook Bancário', ?)
  `).bind(
    p.case_id,
    statusLabels[status] || 'Status Atualizado',
    `${p.payment_type.toUpperCase()} ${status === 'paid' ? 'pago' : status === 'expired' ? 'expirado' : 'cancelado'}`,
    p.payment_type,
    JSON.stringify({ simulated: true, original_status: p.status, new_status: status })
  ).run();

  return c.json({ success: true, message: `Webhook simulado: pagamento ${status}` });
});

// ============================================
// WHATSAPP API ENDPOINTS (DEMO MODE)
// ============================================

// Generate simulated WhatsApp message ID
function generateWhatsAppMessageId(): string {
  return `wamid.${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
}

// List WhatsApp templates
app.get("/api/whatsapp/templates", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM whatsapp_templates WHERE is_active = 1 ORDER BY category, name
  `).all();

  return c.json(results);
});

// Get single template
app.get("/api/whatsapp/templates/:id", authMiddleware, async (c) => {
  const templateId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM whatsapp_templates WHERE id = ?"
  ).bind(templateId).all();

  if (results.length === 0) {
    return c.json({ error: "Template not found" }, 404);
  }

  return c.json(results[0]);
});

// Create template
app.post("/api/whatsapp/templates", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, category, content, variables, language } = body;

  if (!name || !category || !content) {
    return c.json({ error: "name, category, and content are required" }, 400);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO whatsapp_templates (name, category, content, variables, language, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).bind(
    name,
    category,
    content,
    variables ? JSON.stringify(variables) : null,
    language || 'pt_BR'
  ).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update template
app.put("/api/whatsapp/templates/:id", authMiddleware, async (c) => {
  const templateId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE whatsapp_templates SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      content = COALESCE(?, content),
      variables = COALESCE(?, variables),
      status = COALESCE(?, status),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.category,
    body.content,
    body.variables ? JSON.stringify(body.variables) : null,
    body.status,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
    templateId
  ).run();

  return c.json({ success: true });
});

// Delete template
app.delete("/api/whatsapp/templates/:id", authMiddleware, async (c) => {
  const templateId = c.req.param("id");

  await c.env.DB.prepare(
    "UPDATE whatsapp_templates SET is_active = 0 WHERE id = ?"
  ).bind(templateId).run();

  return c.json({ success: true });
});

// Send WhatsApp message (DEMO MODE - simulates sending)
app.post("/api/whatsapp/send", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { case_id, phone_number, message_type, template_name, content, variables } = body;

  if (!phone_number || !content) {
    return c.json({ error: "phone_number and content are required" }, 400);
  }

  // Generate a simulated WhatsApp message ID
  const whatsappMessageId = generateWhatsAppMessageId();

  // If using a template, fetch it
  let finalContent = content;
  if (template_name) {
    const { results: template } = await c.env.DB.prepare(
      "SELECT * FROM whatsapp_templates WHERE name = ?"
    ).bind(template_name).all();

    if (template.length > 0) {
      finalContent = (template[0] as any).content;
      // Replace variables if provided
      if (variables && Array.isArray(variables)) {
        variables.forEach((value: string, index: number) => {
          finalContent = finalContent.replace(`{{${index + 1}}}`, value);
        });
      }
    }
  }

  // Insert message record
  const result = await c.env.DB.prepare(`
    INSERT INTO whatsapp_messages (
      case_id, direction, phone_number, message_type, template_name, content,
      status, whatsapp_message_id, sent_at
    ) VALUES (?, 'outbound', ?, ?, ?, ?, 'sent', ?, CURRENT_TIMESTAMP)
  `).bind(
    case_id || null,
    phone_number,
    message_type || 'text',
    template_name || null,
    finalContent,
    whatsappMessageId
  ).run();

  // Add timeline entry if case_id provided
  if (case_id) {
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name, metadata)
      VALUES (?, 'contact', 'WhatsApp Enviado', ?, 'whatsapp', ?, ?)
    `).bind(
      case_id,
      finalContent.substring(0, 200) + (finalContent.length > 200 ? '...' : ''),
      currentUser?.google_user_data?.name || 'Sistema',
      JSON.stringify({ message_id: result.meta.last_row_id, whatsapp_id: whatsappMessageId })
    ).run();

    // Update case last contact
    await c.env.DB.prepare(`
      UPDATE cases SET last_contact_channel = 'whatsapp', last_contact_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(case_id).run();
  }

  // Simulate delivery after a short delay (in real implementation, this comes via webhook)
  // For demo, we'll mark as delivered immediately
  await c.env.DB.prepare(`
    UPDATE whatsapp_messages SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(result.meta.last_row_id).run();

  // Audit log
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();

  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'whatsapp_sent', 'whatsapp_messages', ?, ?)
  `).bind(
    (appUser[0] as any)?.id,
    result.meta.last_row_id,
    JSON.stringify({ phone_number, template_name, case_id })
  ).run();

  return c.json({
    success: true,
    message_id: result.meta.last_row_id,
    whatsapp_message_id: whatsappMessageId,
    status: 'delivered',
    demo_mode: true
  });
});

// Get messages for a case
app.get("/api/cases/:id/whatsapp", authMiddleware, async (c) => {
  const caseId = c.req.param("id");

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM whatsapp_messages WHERE case_id = ? ORDER BY created_at DESC
  `).bind(caseId).all();

  return c.json(results);
});

// Get all messages (with filters)
app.get("/api/whatsapp/messages", authMiddleware, async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const status = c.req.query("status");
  const direction = c.req.query("direction");

  let query = "SELECT * FROM whatsapp_messages WHERE 1=1";
  const params: any[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (direction) {
    query += " AND direction = ?";
    params.push(direction);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

// Webhook endpoint for Meta WhatsApp (receives status updates and incoming messages)
app.post("/api/whatsapp/webhook", async (c) => {
  // This would normally verify the webhook signature from Meta
  // For demo mode, we accept any incoming data
   
  const body = await c.req.json();
   
  // Meta webhook format (simplified)
  if (body.entry && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
         
        // Handle status updates
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            const whatsappId = status.id;
            const newStatus = status.status; // sent, delivered, read, failed
             
            const updateField = newStatus === 'delivered' ? 'delivered_at' 
              : newStatus === 'read' ? 'read_at' 
              : null;
             
            if (updateField) {
              await c.env.DB.prepare(`
                UPDATE whatsapp_messages 
                SET status = ?, ${updateField} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE whatsapp_message_id = ?
              `).bind(newStatus, whatsappId).run();
            } else {
              await c.env.DB.prepare(`
                UPDATE whatsapp_messages 
                SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
                WHERE whatsapp_message_id = ?
              `).bind(newStatus, status.errors?.[0]?.message || null, whatsappId).run();
            }
          }
        }
         
        // Handle incoming messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const phoneNumber = message.from;
            const messageContent = message.text?.body || message.caption || '[Mídia]';
            const messageType = message.type || 'text';
            const whatsappId = message.id;
             
            // Find case by phone number
            const { results: cases } = await c.env.DB.prepare(
              "SELECT id FROM cases WHERE customer_phone LIKE ?"
            ).bind(`%${phoneNumber.slice(-9)}%`).all();
             
            const caseId = cases.length > 0 ? (cases[0] as any).id : null;
             
            // Insert incoming message
            const result = await c.env.DB.prepare(`
              INSERT INTO whatsapp_messages (
                case_id, direction, phone_number, message_type, content, status, whatsapp_message_id
              ) VALUES (?, 'inbound', ?, ?, ?, 'received', ?)
            `).bind(
              caseId,
              phoneNumber,
              messageType,
              messageContent,
              whatsappId
            ).run();
             
            // Add timeline entry if case found
            if (caseId) {
              await c.env.DB.prepare(`
                INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name, metadata)
                VALUES (?, 'contact', 'WhatsApp Recebido', ?, 'whatsapp', 'Cliente', ?)
              `).bind(
                caseId,
                messageContent.substring(0, 200) + (messageContent.length > 200 ? '...' : ''),
                JSON.stringify({ message_id: result.meta.last_row_id, from: phoneNumber })
              ).run();
            }
          }
        }
      }
    }
  }
   
  return c.json({ success: true });
});

// Webhook verification (Meta sends GET request to verify webhook)
app.get("/api/whatsapp/webhook", async (c) => {
  const mode = c.req.query("hub.mode");
  const challenge = c.req.query("hub.challenge");
   
  // In production, verify token matches your configured webhook verify token
  // For demo, we accept any verification request
  if (mode === "subscribe") {
    return c.text(challenge || "verified");
  }
   
  return c.json({ error: "Invalid verification request" }, 403);
});

// Simulate webhook callback for demo testing
app.post("/api/whatsapp/messages/:id/simulate-status", authMiddleware, async (c) => {
  const messageId = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;
   
  if (!['sent', 'delivered', 'read', 'failed'].includes(status)) {
    return c.json({ error: "Invalid status. Must be: sent, delivered, read, or failed" }, 400);
  }
   
  const { results: message } = await c.env.DB.prepare(
    "SELECT * FROM whatsapp_messages WHERE id = ?"
  ).bind(messageId).all();
   
  if (message.length === 0) {
    return c.json({ error: "Message not found" }, 404);
  }
   
  const updateField = status === 'delivered' ? 'delivered_at' 
    : status === 'read' ? 'read_at' 
    : null;
   
  if (updateField) {
    await c.env.DB.prepare(`
      UPDATE whatsapp_messages 
      SET status = ?, ${updateField} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, messageId).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE whatsapp_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, messageId).run();
  }
   
  return c.json({ success: true, message: `Status simulado: ${status}` });
});

// Simulate incoming message for demo testing
app.post("/api/whatsapp/simulate-incoming", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { case_id, phone_number, content } = body;
   
  if (!phone_number || !content) {
    return c.json({ error: "phone_number and content are required" }, 400);
  }
   
  const whatsappId = generateWhatsAppMessageId();
   
  const result = await c.env.DB.prepare(`
    INSERT INTO whatsapp_messages (
      case_id, direction, phone_number, message_type, content, status, whatsapp_message_id
    ) VALUES (?, 'inbound', ?, 'text', ?, 'received', ?)
  `).bind(
    case_id || null,
    phone_number,
    content,
    whatsappId
  ).run();
   
  // Add timeline entry if case_id provided
  if (case_id) {
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name, metadata)
      VALUES (?, 'contact', 'WhatsApp Recebido', ?, 'whatsapp', 'Cliente', ?)
    `).bind(
      case_id,
      content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      JSON.stringify({ message_id: result.meta.last_row_id, simulated: true })
    ).run();
  }
   
  return c.json({
    success: true,
    message_id: result.meta.last_row_id,
    whatsapp_message_id: whatsappId,
    demo_mode: true
  });
});

// ============================================
// SUPERVISOR / RISK ALERTS ENDPOINTS
// ============================================

// Get all risk alerts with case info
app.get("/api/risk-alerts", authMiddleware, async (c) => {
  const severity = c.req.query("severity");
  const resolved = c.req.query("resolved");
   
  let query = `
    SELECT ra.*, c.case_number, c.customer_name, c.total_debt
    FROM risk_alerts ra
    LEFT JOIN cases c ON ra.case_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
   
  if (severity && severity !== 'all') {
    query += " AND ra.severity = ?";
    params.push(severity);
  }
   
  if (resolved === 'false') {
    query += " AND ra.is_resolved = 0";
  } else if (resolved === 'true') {
    query += " AND ra.is_resolved = 1";
  }
   
  query += " ORDER BY CASE ra.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, ra.created_at DESC";
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get supervisor stats
app.get("/api/supervisor/stats", authMiddleware, async (c) => {
  const { results: alertStats } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_alerts,
      SUM(CASE WHEN severity = 'critical' AND is_resolved = 0 THEN 1 ELSE 0 END) as critical_alerts,
      SUM(CASE WHEN is_resolved = 1 AND date(resolved_at) = date('now') THEN 1 ELSE 0 END) as resolved_today
    FROM risk_alerts
  `).all();
   
  const { results: caseStats } = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT case_id) as cases_at_risk
    FROM risk_alerts WHERE is_resolved = 0
  `).all();
   
  const { results: actionStats } = await c.env.DB.prepare(`
    SELECT COUNT(*) as pending_actions
    FROM supervisor_actions WHERE status = 'pending'
  `).all();
   
  return c.json({
    total_alerts: (alertStats[0] as any)?.total_alerts || 0,
    critical_alerts: (alertStats[0] as any)?.critical_alerts || 0,
    resolved_today: (alertStats[0] as any)?.resolved_today || 0,
    cases_at_risk: (caseStats[0] as any)?.cases_at_risk || 0,
    pending_actions: (actionStats[0] as any)?.pending_actions || 0,
    avg_resolution_time: 2
  });
});

// Acknowledge an alert
app.post("/api/risk-alerts/:id/acknowledge", authMiddleware, async (c) => {
  const alertId = c.req.param("id");
   
  await c.env.DB.prepare(`
    UPDATE risk_alerts SET 
      is_acknowledged = 1, 
      acknowledged_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(alertId).run();
   
  return c.json({ success: true });
});

// Resolve an alert
app.post("/api/risk-alerts/:id/resolve", authMiddleware, async (c) => {
  const alertId = c.req.param("id");
  const body = await c.req.json();
   
  await c.env.DB.prepare(`
    UPDATE risk_alerts SET 
      is_resolved = 1,
      resolved_at = CURRENT_TIMESTAMP,
      resolution_notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(body.notes || null, alertId).run();
   
  return c.json({ success: true });
});

// Create a risk alert manually
app.post("/api/risk-alerts", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { case_id, alert_type, severity, title, description, risk_score, metadata } = body;
   
  if (!case_id || !alert_type || !title) {
    return c.json({ error: "case_id, alert_type, and title are required" }, 400);
  }
   
  const result = await c.env.DB.prepare(`
    INSERT INTO risk_alerts (case_id, alert_type, severity, title, description, risk_score, auto_generated, metadata)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).bind(
    case_id,
    alert_type,
    severity || 'medium',
    title,
    description,
    risk_score || 50,
    metadata ? JSON.stringify(metadata) : null
  ).run();
   
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Get risk rules
app.get("/api/risk-rules", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM risk_rules ORDER BY severity DESC, name
  `).all();
  return c.json(results);
});

// Toggle risk rule active status
app.post("/api/risk-rules/:id/toggle", authMiddleware, async (c) => {
  const ruleId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(
    "SELECT is_active FROM risk_rules WHERE id = ?"
  ).bind(ruleId).all();
   
  if (results.length === 0) {
    return c.json({ error: "Rule not found" }, 404);
  }
   
  const newStatus = (results[0] as any).is_active ? 0 : 1;
   
  await c.env.DB.prepare(`
    UPDATE risk_rules SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, ruleId).run();
   
  return c.json({ success: true, is_active: newStatus === 1 });
});

// Create/update risk rule
app.post("/api/risk-rules", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, description, rule_type, conditions, severity, alert_template, is_active } = body;
   
  if (!name || !rule_type || !conditions) {
    return c.json({ error: "name, rule_type, and conditions are required" }, 400);
  }
   
  const result = await c.env.DB.prepare(`
    INSERT INTO risk_rules (name, description, rule_type, conditions, severity, alert_template, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name,
    description,
    rule_type,
    typeof conditions === 'string' ? conditions : JSON.stringify(conditions),
    severity || 'medium',
    alert_template,
    is_active !== false ? 1 : 0
  ).run();
   
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Get supervisor actions
app.get("/api/supervisor/actions", authMiddleware, async (c) => {
  const status = c.req.query("status");
   
  let query = "SELECT * FROM supervisor_actions WHERE 1=1";
  const params: any[] = [];
   
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
   
  query += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at DESC";
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Create supervisor action
app.post("/api/supervisor/actions", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { alert_id, case_id, action_type, description, priority, assigned_to_id, assigned_to_name, due_at } = body;
   
  const result = await c.env.DB.prepare(`
    INSERT INTO supervisor_actions (alert_id, case_id, action_type, description, priority, assigned_to_id, assigned_to_name, due_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    alert_id,
    case_id,
    action_type,
    description,
    priority || 'normal',
    assigned_to_id,
    assigned_to_name,
    due_at
  ).run();
   
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Complete supervisor action
app.post("/api/supervisor/actions/:id/complete", authMiddleware, async (c) => {
  const actionId = c.req.param("id");
  const body = await c.req.json();
   
  await c.env.DB.prepare(`
    UPDATE supervisor_actions SET 
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      result = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(body.result || null, actionId).run();
   
  return c.json({ success: true });
});

// Run risk detection (analyze cases and create alerts)
app.post("/api/supervisor/run-detection", authMiddleware, async (c) => {
  // Get active rules
  const { results: rules } = await c.env.DB.prepare(`
    SELECT * FROM risk_rules WHERE is_active = 1
  `).all();
   
  let alertsCreated = 0;
   
  for (const rule of rules as any[]) {
    const conditions = JSON.parse(rule.conditions);
     
    if (rule.rule_type === 'no_contact') {
      const daysThreshold = conditions.days_without_contact || 15;
      const { results: cases } = await c.env.DB.prepare(`
        SELECT * FROM cases 
        WHERE (last_contact_at IS NULL OR last_contact_at < datetime('now', '-' || ? || ' days'))
        AND status NOT IN ('closed', 'paid')
      `).bind(daysThreshold).all();
       
      for (const cs of cases as any[]) {
        // Check if alert already exists
        const { results: existing } = await c.env.DB.prepare(`
          SELECT id FROM risk_alerts 
          WHERE case_id = ? AND alert_type = ? AND is_resolved = 0
        `).bind(cs.id, rule.rule_type).all();
         
        if (existing.length === 0) {
          await c.env.DB.prepare(`
            INSERT INTO risk_alerts (case_id, alert_type, severity, title, description, risk_score, auto_generated)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(
            cs.id,
            rule.rule_type,
            rule.severity,
            `Sem contato há ${daysThreshold}+ dias`,
            `Caso #${cs.case_number} está sem contato há muito tempo`,
            60
          ).run();
          alertsCreated++;
        }
      }
    }
     
    if (rule.rule_type === 'high_value_risk') {
      const minDebt = conditions.min_debt || 50000;
      const minDays = conditions.min_days_overdue || 90;
      const { results: cases } = await c.env.DB.prepare(`
        SELECT * FROM cases 
        WHERE total_debt >= ? AND days_overdue >= ?
        AND status NOT IN ('closed', 'paid')
      `).bind(minDebt, minDays).all();
       
      for (const cs of cases as any[]) {
        const { results: existing } = await c.env.DB.prepare(`
          SELECT id FROM risk_alerts 
          WHERE case_id = ? AND alert_type = ? AND is_resolved = 0
        `).bind(cs.id, rule.rule_type).all();
         
        if (existing.length === 0) {
          await c.env.DB.prepare(`
            INSERT INTO risk_alerts (case_id, alert_type, severity, title, description, risk_score, auto_generated)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(
            cs.id,
            rule.rule_type,
            rule.severity,
            'Alto valor em risco',
            `Dívida de R$ ${cs.total_debt.toLocaleString()} com ${cs.days_overdue} dias de atraso`,
            95
          ).run();
          alertsCreated++;
        }
      }
    }
     
    if (rule.rule_type === 'missing_consent') {
      const { results: cases } = await c.env.DB.prepare(`
        SELECT * FROM cases 
        WHERE has_consent = 0
        AND status NOT IN ('closed', 'paid')
      `).all();
       
      for (const cs of cases as any[]) {
        const { results: existing } = await c.env.DB.prepare(`
          SELECT id FROM risk_alerts 
          WHERE case_id = ? AND alert_type = ? AND is_resolved = 0
        `).bind(cs.id, rule.rule_type).all();
         
        if (existing.length === 0) {
          await c.env.DB.prepare(`
            INSERT INTO risk_alerts (case_id, alert_type, severity, title, description, risk_score, auto_generated)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(
            cs.id,
            rule.rule_type,
            rule.severity,
            'Consentimento LGPD pendente',
            `Caso #${cs.case_number} sem consentimento registrado`,
            40
          ).run();
          alertsCreated++;
        }
      }
    }
  }
   
  return c.json({ success: true, alerts_created: alertsCreated });
});

// ============================================
// LGPD CONSENT MANAGEMENT ENDPOINTS
// ============================================

// Get consent types
app.get("/api/consent/types", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM consent_types WHERE is_active = 1 ORDER BY is_required DESC, name
  `).all();
  return c.json(results);
});

// Get consent records for a case
app.get("/api/cases/:id/consents", authMiddleware, async (c) => {
  const caseId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(`
    SELECT cr.*, ct.code as type_code, ct.name as type_name, ct.legal_basis, ct.is_required
    FROM consent_records cr
    JOIN consent_types ct ON cr.consent_type_id = ct.id
    WHERE cr.case_id = ?
    ORDER BY ct.is_required DESC, ct.name
  `).bind(caseId).all();
   
  return c.json(results);
});

// Get consent records by customer document
app.get("/api/consent/by-document/:document", authMiddleware, async (c) => {
  const document = c.req.param("document");
   
  const { results } = await c.env.DB.prepare(`
    SELECT cr.*, ct.code as type_code, ct.name as type_name, ct.legal_basis, ct.is_required
    FROM consent_records cr
    JOIN consent_types ct ON cr.consent_type_id = ct.id
    WHERE cr.customer_document = ?
    ORDER BY cr.created_at DESC
  `).bind(document).all();
   
  return c.json(results);
});

// Get consent stats
app.get("/api/consent/stats", authMiddleware, async (c) => {
  const { results: stats } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN status = 'granted' THEN 1 ELSE 0 END) as granted_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked_count,
      COUNT(DISTINCT customer_document) as unique_customers
    FROM consent_records
  `).all();
   
  const { results: byType } = await c.env.DB.prepare(`
    SELECT ct.name, ct.code, 
      SUM(CASE WHEN cr.status = 'granted' THEN 1 ELSE 0 END) as granted,
      SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN cr.status = 'revoked' THEN 1 ELSE 0 END) as revoked
    FROM consent_types ct
    LEFT JOIN consent_records cr ON ct.id = cr.consent_type_id
    WHERE ct.is_active = 1
    GROUP BY ct.id
  `).all();
   
  const { results: recentActivity } = await c.env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM consent_history
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all();
   
  return c.json({
    summary: stats[0],
    byType,
    recentActivity
  });
});

// Create or update consent record
app.post("/api/consent", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { 
    case_id, customer_document, customer_name, customer_email, customer_phone,
    consent_type_id, status, collection_method, collection_channel, notes, ip_address
  } = body;
   
  if (!customer_document || !consent_type_id) {
    return c.json({ error: "customer_document and consent_type_id are required" }, 400);
  }
   
  // Get app user
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id, name FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  // Check if record exists for this customer + type
  const { results: existing } = await c.env.DB.prepare(`
    SELECT * FROM consent_records 
    WHERE customer_document = ? AND consent_type_id = ?
  `).bind(customer_document, consent_type_id).all();
   
  const grantedAt = status === 'granted' ? new Date().toISOString() : null;
  const revokedAt = status === 'revoked' ? new Date().toISOString() : null;
   
  let recordId: number;
  let oldStatus: string | null = null;
   
  if (existing.length > 0) {
    // Update existing
    recordId = (existing[0] as any).id;
    oldStatus = (existing[0] as any).status;
     
    await c.env.DB.prepare(`
      UPDATE consent_records SET
        case_id = COALESCE(?, case_id),
        customer_name = COALESCE(?, customer_name),
        customer_email = COALESCE(?, customer_email),
        customer_phone = COALESCE(?, customer_phone),
        status = ?,
        granted_at = COALESCE(?, granted_at),
        revoked_at = ?,
        collection_method = COALESCE(?, collection_method),
        collection_channel = COALESCE(?, collection_channel),
        ip_address = COALESCE(?, ip_address),
        notes = COALESCE(?, notes),
        collected_by_id = ?,
        collected_by_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      case_id, customer_name, customer_email, customer_phone,
      status,
      grantedAt, revokedAt,
      collection_method, collection_channel, ip_address, notes,
      (appUser[0] as any)?.id, (appUser[0] as any)?.name || currentUser?.email,
      recordId
    ).run();
  } else {
    // Create new
    const result = await c.env.DB.prepare(`
      INSERT INTO consent_records (
        case_id, customer_document, customer_name, customer_email, customer_phone,
        consent_type_id, status, granted_at, revoked_at,
        collection_method, collection_channel, ip_address, notes,
        collected_by_id, collected_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      case_id, customer_document, customer_name, customer_email, customer_phone,
      consent_type_id, status || 'pending', grantedAt, revokedAt,
      collection_method, collection_channel, ip_address, notes,
      (appUser[0] as any)?.id, (appUser[0] as any)?.name || currentUser?.email
    ).run();
     
    recordId = result.meta.last_row_id as number;
  }
   
  // Add to history
  await c.env.DB.prepare(`
    INSERT INTO consent_history (
      consent_record_id, action, old_status, new_status, reason,
      performed_by_id, performed_by_name, ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    recordId,
    existing.length > 0 ? 'updated' : 'created',
    oldStatus,
    status,
    notes,
    (appUser[0] as any)?.id,
    (appUser[0] as any)?.name || currentUser?.email,
    ip_address
  ).run();
   
  // Update case has_consent flag if case_id provided
  if (case_id) {
    // Check if all required consents are granted
    const { results: requiredCheck } = await c.env.DB.prepare(`
      SELECT ct.id,
        (SELECT status FROM consent_records cr 
         WHERE cr.case_id = ? AND cr.consent_type_id = ct.id 
         ORDER BY created_at DESC LIMIT 1) as current_status
      FROM consent_types ct
      WHERE ct.is_required = 1 AND ct.is_active = 1
    `).bind(case_id).all();
     
    const allGranted = (requiredCheck as any[]).every(r => r.current_status === 'granted');
     
    await c.env.DB.prepare(`
      UPDATE cases SET has_consent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(allGranted ? 1 : 0, case_id).run();
     
    // Add timeline entry
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, user_name)
      VALUES (?, 'consent', ?, ?, ?)
    `).bind(
      case_id,
      status === 'granted' ? 'Consentimento Concedido' : status === 'revoked' ? 'Consentimento Revogado' : 'Consentimento Atualizado',
      `Status do consentimento alterado para "${status}"`,
      (appUser[0] as any)?.name || currentUser?.email
    ).run();
  }
   
  return c.json({ success: true, id: recordId });
});

// Revoke consent
app.post("/api/consent/:id/revoke", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const consentId = c.req.param("id");
  const body = await c.req.json();
  const { reason } = body;
   
  const { results: record } = await c.env.DB.prepare(
    "SELECT * FROM consent_records WHERE id = ?"
  ).bind(consentId).all();
   
  if (record.length === 0) {
    return c.json({ error: "Consent record not found" }, 404);
  }
   
  const consent = record[0] as any;
   
  // Get app user
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id, name FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  await c.env.DB.prepare(`
    UPDATE consent_records SET 
      status = 'revoked', 
      revoked_at = CURRENT_TIMESTAMP,
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(reason, consentId).run();
   
  // Add history
  await c.env.DB.prepare(`
    INSERT INTO consent_history (
      consent_record_id, action, old_status, new_status, reason,
      performed_by_id, performed_by_name
    ) VALUES (?, 'revoked', ?, 'revoked', ?, ?, ?)
  `).bind(
    consentId,
    consent.status,
    reason,
    (appUser[0] as any)?.id,
    (appUser[0] as any)?.name || currentUser?.email
  ).run();
   
  // Update case if linked
  if (consent.case_id) {
    await c.env.DB.prepare(`
      UPDATE cases SET has_consent = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(consent.case_id).run();
     
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, user_name)
      VALUES (?, 'consent', 'Consentimento Revogado', ?, ?)
    `).bind(
      consent.case_id,
      reason || 'Consentimento revogado pelo titular',
      (appUser[0] as any)?.name || currentUser?.email
    ).run();
  }
   
  return c.json({ success: true });
});

// Get consent history
app.get("/api/consent/:id/history", authMiddleware, async (c) => {
  const consentId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM consent_history 
    WHERE consent_record_id = ? 
    ORDER BY created_at DESC
  `).bind(consentId).all();
   
  return c.json(results);
});

// Bulk consent update (for importing or batch operations)
app.post("/api/consent/bulk", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { records } = body;
   
  if (!records || !Array.isArray(records)) {
    return c.json({ error: "records array is required" }, 400);
  }
   
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id, name FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  let created = 0;
  let updated = 0;
  let errors: string[] = [];
   
  for (const record of records) {
    try {
      const { customer_document, consent_type_id, status, collection_method, collection_channel } = record;
       
      if (!customer_document || !consent_type_id) {
        errors.push(`Missing required fields for record`);
        continue;
      }
       
      const { results: existing } = await c.env.DB.prepare(`
        SELECT id FROM consent_records WHERE customer_document = ? AND consent_type_id = ?
      `).bind(customer_document, consent_type_id).all();
       
      const grantedAt = status === 'granted' ? new Date().toISOString() : null;
       
      if (existing.length > 0) {
        await c.env.DB.prepare(`
          UPDATE consent_records SET 
            status = ?, granted_at = COALESCE(?, granted_at),
            collection_method = ?, collection_channel = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(status, grantedAt, collection_method, collection_channel, (existing[0] as any).id).run();
        updated++;
      } else {
        await c.env.DB.prepare(`
          INSERT INTO consent_records (
            customer_document, consent_type_id, status, granted_at,
            collection_method, collection_channel, collected_by_id, collected_by_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          customer_document, consent_type_id, status || 'pending', grantedAt,
          collection_method, collection_channel,
          (appUser[0] as any)?.id, (appUser[0] as any)?.name
        ).run();
        created++;
      }
    } catch (err: any) {
      errors.push(err.message);
    }
  }
   
  return c.json({ success: true, created, updated, errors });
});

// Search consent records
app.get("/api/consent/search", authMiddleware, async (c) => {
  const query = c.req.query("q");
  const status = c.req.query("status");
  const typeId = c.req.query("type_id");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
   
  let sql = `
    SELECT cr.*, ct.code as type_code, ct.name as type_name, ct.legal_basis
    FROM consent_records cr
    JOIN consent_types ct ON cr.consent_type_id = ct.id
    WHERE 1=1
  `;
  const params: any[] = [];
   
  if (query) {
    sql += " AND (cr.customer_document LIKE ? OR cr.customer_name LIKE ? OR cr.customer_email LIKE ?)";
    const searchPattern = `%${query}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  if (status) {
    sql += " AND cr.status = ?";
    params.push(status);
  }
  if (typeId) {
    sql += " AND cr.consent_type_id = ?";
    params.push(typeId);
  }
   
  sql += " ORDER BY cr.updated_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
   
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
   
  // Get total count
  let countSql = "SELECT COUNT(*) as total FROM consent_records cr WHERE 1=1";
  const countParams: any[] = [];
   
  if (query) {
    countSql += " AND (cr.customer_document LIKE ? OR cr.customer_name LIKE ? OR cr.customer_email LIKE ?)";
    const searchPattern = `%${query}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }
  if (status) {
    countSql += " AND cr.status = ?";
    countParams.push(status);
  }
  if (typeId) {
    countSql += " AND cr.consent_type_id = ?";
    countParams.push(typeId);
  }
   
  const { results: countResult } = await c.env.DB.prepare(countSql).bind(...countParams).all();
   
  return c.json({ 
    records: results,
    total: (countResult[0] as any).total
  });
});

// Export consent data (LGPD data portability)
app.get("/api/consent/export/:document", authMiddleware, async (c) => {
  const document = c.req.param("document");
   
  // Get all consent records
  const { results: records } = await c.env.DB.prepare(`
    SELECT cr.*, ct.name as consent_type, ct.legal_basis
    FROM consent_records cr
    JOIN consent_types ct ON cr.consent_type_id = ct.id
    WHERE cr.customer_document = ?
    ORDER BY cr.created_at
  `).bind(document).all();
   
  // Get consent history
  const recordIds = (records as any[]).map(r => r.id);
  let history: any[] = [];
   
  if (recordIds.length > 0) {
    const { results: historyResults } = await c.env.DB.prepare(`
      SELECT ch.*, cr.consent_type_id
      FROM consent_history ch
      JOIN consent_records cr ON ch.consent_record_id = cr.id
      WHERE cr.customer_document = ?
      ORDER BY ch.created_at
    `).bind(document).all();
    history = historyResults as any[];
  }
   
  const exportData = {
    document,
    exported_at: new Date().toISOString(),
    consents: records,
    history
  };
   
  return c.json(exportData);
});

// ============================================
// INTEGRATIONS ENDPOINTS
// ============================================

// List all integrations
app.get("/api/integrations", authMiddleware, async (c) => {
  const category = c.req.query("category");
   
  let query = "SELECT * FROM integrations WHERE 1=1";
  const params: any[] = [];
   
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
   
  query += " ORDER BY category, name";
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get integration stats
app.get("/api/integrations/stats", authMiddleware, async (c) => {
  const { results: integrations } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' OR status = 'connected' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
    FROM integrations
  `).all();
   
  const { results: webhooks } = await c.env.DB.prepare(`
    SELECT 
      SUM(stats_sent) as total_sent,
      SUM(stats_failed) as total_failed
    FROM webhook_endpoints
  `).all();
   
  const { results: todayLogs } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM webhook_logs 
    WHERE created_at >= datetime('now', '-1 day')
  `).all();
   
  return c.json({
    integrations: integrations[0],
    webhooks: webhooks[0],
    eventsToday: (todayLogs[0] as any)?.count || 0
  });
});

// Create integration
app.post("/api/integrations", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, type, category, config, credentials, status, sync_interval, environment } = body;

  // 1. Cria a integração primeiro para obter o ID
  const result = await c.env.DB.prepare(`
    INSERT INTO integrations (name, type, category, status, environment)
    VALUES (?, ?, ?, ?, ?)
  `).bind(name, type, category, status || 'inactive', environment || 'sandbox').run();

  const newId = result.meta.last_row_id;

  // 2. REGRA: Gera a chave matemática baseada no ID recém-criado
  const generateStableKey = (id: number, prefix: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = prefix;
    for (let i = 0; i < 32; i++) {
      const seed = id + (i * 1337); 
      const randomish = Math.abs(Math.sin(seed) * 10000) % 1;
      key += chars.charAt(Math.floor(randomish * chars.length));
    }
    return key;
  };

  const prefix = type === 'beta_erp' ? 'beta_' : 'sap_';
  const autoKey = generateStableKey(Number(newId), prefix);

  // 3. Atualiza imediatamente com a chave matemática e os outros dados
  const finalCredentials = credentials || {};
  finalCredentials.api_key = autoKey;

  await c.env.DB.prepare(`
    UPDATE integrations SET 
      config = ?, 
      credentials = ? 
    WHERE id = ?
  `).bind(
    config ? JSON.stringify(config) : null,
    JSON.stringify(finalCredentials),
    newId
  ).run();

  return c.json({ success: true, id: newId, api_key: autoKey });
});


// Update integration (COM AUTO-GERAÇÃO DE CHAVE NO BACKEND)
app.put("/api/integrations/:id", authMiddleware, async (c) => {
  const integrationId = c.req.param("id");
  const body = await c.req.json();

  // 1. Função da regra matemática (Sempre idêntica)
  const generateStableKey = (id: any, prefix: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = prefix;
    for (let i = 0; i < 32; i++) {
      const seed = Number(id) + (i * 1337); 
      const randomish = Math.abs(Math.sin(seed) * 10000) % 1;
      res += chars.charAt(Math.floor(randomish * chars.length));
    }
    return res;
  };

  // 2. Busca o que tem hoje no banco para não perder dados importantes
  const current = await c.env.DB.prepare("SELECT * FROM integrations WHERE id = ?").bind(integrationId).first();
  if (!current) return c.json({ error: "Not found" }, 404);

  // 3. REGRA ABSOLUTA DE CREDENCIAIS
  let creds = body.credentials || {};
  if (typeof creds === 'string') try { creds = JSON.parse(creds); } catch(e) { creds = {}; }

  // Se for Beta e a api_key estiver vazia, gera agora!
  const prefix = (body.type || current.type) === 'sap_b1' ? 'sap_' : 'beta_';
  if (!creds.api_key || creds.api_key.length < 5) {
    creds.api_key = generateStableKey(integrationId, prefix);
    console.log(`[REGRA] Injetando chave matemática: ${creds.api_key}`);
  }

  // 4. Executa o UPDATE (Simplificado para garantir sucesso)
  try {
    await c.env.DB.prepare(`
      UPDATE integrations SET
        name = ?,
        type = ?,
        config = ?,
        credentials = ?, 
        status = ?,
        environment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name || current.name,
      body.type || current.type,
      body.config ? JSON.stringify(body.config) : current.config,
      JSON.stringify(creds), // O JSON com a chave matemática JÁ ESTÁ AQUI
      body.status || current.status,
      body.environment || current.environment,
      integrationId
    ).run();

    (globalThis as any).console.log(`[REGRA] Banco atualizado com sucesso para o ID ${integrationId}`);
    return c.json({ success: true, credentials: creds });

  } catch (error) {
    (globalThis as any).console.error(`[ERRO BANCO]`, error);
    return c.json({ success: false, error: "Falha ao gravar no banco" }, 500);
  }
});

// Delete integration
app.delete("/api/integrations/:id", authMiddleware, async (c) => {
  const integrationId = c.req.param("id");
   
  await c.env.DB.prepare("DELETE FROM integrations WHERE id = ?").bind(integrationId).run();
   
  return c.json({ success: true });
});

// Test integration connection
app.post("/api/integrations/:id/test", authMiddleware, async (c) => {
  const integrationId = c.req.param("id");
   
  // Simulate connection test
  const success = Math.random() > 0.2; // 80% success rate for demo
  const latency = Math.floor(Math.random() * 500) + 50;
   
  if (success) {
    await c.env.DB.prepare(`
      UPDATE integrations SET status = 'active', last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(integrationId).run();
  }
   
  return c.json({ 
    success, 
    latency, 
    message: success ? 'Conexão estabelecida com sucesso' : 'Falha na conexão. Verifique as credenciais.'
  });
});

// Sync integration
app.post("/api/integrations/:id/sync", authMiddleware, async (c) => {
  const integrationId = c.req.param("id");
   
  // Simulate sync
  const recordsProcessed = Math.floor(Math.random() * 100) + 10;
  const errors = Math.floor(Math.random() * 5);
   
  await c.env.DB.prepare(`
    UPDATE integrations SET 
      last_sync_at = CURRENT_TIMESTAMP,
      stats_today = stats_today + ?,
      stats_month = stats_month + ?,
      stats_errors = stats_errors + ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(recordsProcessed, recordsProcessed, errors, integrationId).run();
   
  return c.json({ 
    success: true, 
    records_processed: recordsProcessed,
    errors,
    message: `Sincronização concluída: ${recordsProcessed} registros processados`
  });
});

// ============================================
// WEBHOOK ENDPOINTS MANAGEMENT
// ============================================

// List webhook endpoints
app.get("/api/webhooks", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM webhook_endpoints ORDER BY created_at DESC
  `).all();
   
  return c.json(results);
});

// Create webhook endpoint
app.post("/api/webhooks", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, url, events, status } = body;
   
  if (!name || !url || !events) {
    return c.json({ error: "name, url, and events are required" }, 400);
  }
   
  // Generate secret
  const secret = `whsec_${Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('')}`;
   
  const result = await c.env.DB.prepare(`
    INSERT INTO webhook_endpoints (name, url, events, secret, status)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    name,
    url,
    Array.isArray(events) ? JSON.stringify(events) : events,
    secret,
    status || 'active'
  ).run();
   
  return c.json({ success: true, id: result.meta.last_row_id, secret });
});

// Update webhook endpoint
app.put("/api/webhooks/:id", authMiddleware, async (c) => {
  const webhookId = c.req.param("id");
  const body = await c.req.json();
   
  await c.env.DB.prepare(`
    UPDATE webhook_endpoints SET
      name = COALESCE(?, name),
      url = COALESCE(?, url),
      events = COALESCE(?, events),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.url,
    body.events ? (Array.isArray(body.events) ? JSON.stringify(body.events) : body.events) : null,
    body.status,
    webhookId
  ).run();
   
  return c.json({ success: true });
});

// Delete webhook endpoint
app.delete("/api/webhooks/:id", authMiddleware, async (c) => {
  const webhookId = c.req.param("id");
   
  // Delete associated logs first
  await c.env.DB.prepare("DELETE FROM webhook_logs WHERE endpoint_id = ?").bind(webhookId).run();
  await c.env.DB.prepare("DELETE FROM webhook_endpoints WHERE id = ?").bind(webhookId).run();
   
  return c.json({ success: true });
});

// Toggle webhook status
app.post("/api/webhooks/:id/toggle", authMiddleware, async (c) => {
  const webhookId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(
    "SELECT status FROM webhook_endpoints WHERE id = ?"
  ).bind(webhookId).all();
   
  if (results.length === 0) {
    return c.json({ error: "Webhook not found" }, 404);
  }
   
  const newStatus = (results[0] as any).status === 'active' ? 'paused' : 'active';
   
  await c.env.DB.prepare(`
    UPDATE webhook_endpoints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, webhookId).run();
   
  return c.json({ success: true, status: newStatus });
});

// Regenerate webhook secret
app.post("/api/webhooks/:id/regenerate-secret", authMiddleware, async (c) => {
  const webhookId = c.req.param("id");
   
  const newSecret = `whsec_${Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('')}`;
   
  await c.env.DB.prepare(`
    UPDATE webhook_endpoints SET secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newSecret, webhookId).run();
   
  return c.json({ success: true, secret: newSecret });
});

// Test webhook endpoint
app.post("/api/webhooks/:id/test", authMiddleware, async (c) => {
  const webhookId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM webhook_endpoints WHERE id = ?"
  ).bind(webhookId).all();
   
  if (results.length === 0) {
    return c.json({ error: "Webhook not found" }, 404);
  }
   
  // Simulate sending test webhook
  const success = Math.random() > 0.1; // 90% success rate for tests
  const latency = Math.floor(Math.random() * 300) + 50;
  const statusCode = success ? 200 : (Math.random() > 0.5 ? 500 : 503);
   
  // Log the test
  await c.env.DB.prepare(`
    INSERT INTO webhook_logs (endpoint_id, event_type, status, status_code, latency, request_payload)
    VALUES (?, 'test.ping', ?, ?, ?, ?)
  `).bind(
    webhookId,
    success ? 'success' : 'failed',
    statusCode,
    latency,
    JSON.stringify({ event: 'test.ping', timestamp: new Date().toISOString() })
  ).run();
   
  // Update stats
  if (success) {
    await c.env.DB.prepare(`
      UPDATE webhook_endpoints SET stats_sent = stats_sent + 1, avg_latency = ? WHERE id = ?
    `).bind(latency, webhookId).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE webhook_endpoints SET stats_failed = stats_failed + 1 WHERE id = ?
    `).bind(webhookId).run();
  }
   
  return c.json({ 
    success, 
    status_code: statusCode,
    latency,
    message: success ? 'Webhook entregue com sucesso' : 'Falha na entrega do webhook'
  });
});

// ============================================
// WEBHOOK LOGS ENDPOINTS
// ============================================

// List webhook logs
app.get("/api/webhook-logs", authMiddleware, async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const endpointId = c.req.query("endpoint_id");
  const status = c.req.query("status");
  const eventType = c.req.query("event_type");
   
  let query = `
    SELECT wl.*, we.name as endpoint_name, we.url as endpoint_url
    FROM webhook_logs wl
    LEFT JOIN webhook_endpoints we ON wl.endpoint_id = we.id
    WHERE 1=1
  `;
  const params: any[] = [];
   
  if (endpointId) {
    query += " AND wl.endpoint_id = ?";
    params.push(endpointId);
  }
  if (status) {
    query += " AND wl.status = ?";
    params.push(status);
  }
  if (eventType) {
    query += " AND wl.event_type LIKE ?";
    params.push(`%${eventType}%`);
  }
   
  query += " ORDER BY wl.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
   
  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM webhook_logs WHERE 1=1";
  const countParams: any[] = [];
  if (endpointId) {
    countQuery += " AND endpoint_id = ?";
    countParams.push(endpointId);
  }
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }
   
  const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all();
   
  return c.json({ 
    logs: results, 
    total: (countResult[0] as any).total 
  });
});

// Get single log with full payload
app.get("/api/webhook-logs/:id", authMiddleware, async (c) => {
  const logId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(`
    SELECT wl.*, we.name as endpoint_name, we.url as endpoint_url
    FROM webhook_logs wl
    LEFT JOIN webhook_endpoints we ON wl.endpoint_id = we.id
    WHERE wl.id = ?
  `).bind(logId).all();
   
  if (results.length === 0) {
    return c.json({ error: "Log not found" }, 404);
  }
   
  return c.json(results[0]);
});

// Retry failed webhook
app.post("/api/webhook-logs/:id/retry", authMiddleware, async (c) => {
  const logId = c.req.param("id");
   
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM webhook_logs WHERE id = ?"
  ).bind(logId).all();
   
  if (results.length === 0) {
    return c.json({ error: "Log not found" }, 404);
  }
   
  const log = results[0] as any;
   
  // Simulate retry
  const success = Math.random() > 0.3; // 70% success rate on retry
  const latency = Math.floor(Math.random() * 300) + 50;
  const statusCode = success ? 200 : 500;
   
  // Update original log
  await c.env.DB.prepare(`
    UPDATE webhook_logs SET 
      status = ?,
      status_code = ?,
      latency = ?,
      retry_count = retry_count + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(success ? 'success' : 'failed', statusCode, latency, logId).run();
   
  // Update endpoint stats
  if (success) {
    await c.env.DB.prepare(`
      UPDATE webhook_endpoints SET stats_sent = stats_sent + 1, stats_failed = stats_failed - 1 WHERE id = ?
    `).bind(log.endpoint_id).run();
  }
   
  return c.json({ 
    success, 
    status_code: statusCode,
    latency,
    message: success ? 'Webhook reenviado com sucesso' : 'Falha no reenvio'
  });
});

// Simulate webhook delivery (for demo/testing)
app.post("/api/webhooks/simulate", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { event_type, payload } = body;
   
  if (!event_type) {
    return c.json({ error: "event_type is required" }, 400);
  }
   
  // Get all active endpoints that subscribe to this event
  const { results: endpoints } = await c.env.DB.prepare(`
    SELECT * FROM webhook_endpoints WHERE status = 'active'
  `).all();
   
  const deliveries: any[] = [];
   
  for (const endpoint of endpoints as any[]) {
    const events = JSON.parse(endpoint.events || '[]');
    if (events.includes('*') || events.includes(event_type)) {
      // Simulate delivery
      const success = Math.random() > 0.15;
      const latency = Math.floor(Math.random() * 500) + 50;
      const statusCode = success ? 200 : (Math.random() > 0.5 ? 500 : 503);
       
      // Create log entry
      const result = await c.env.DB.prepare(`
        INSERT INTO webhook_logs (endpoint_id, event_type, status, status_code, latency, request_payload)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        endpoint.id,
        event_type,
        success ? 'success' : 'failed',
        statusCode,
        latency,
        JSON.stringify(payload || { event: event_type, timestamp: new Date().toISOString() })
      ).run();
       
      // Update endpoint stats
      if (success) {
        await c.env.DB.prepare(`
          UPDATE webhook_endpoints SET stats_sent = stats_sent + 1, avg_latency = ? WHERE id = ?
        `).bind(latency, endpoint.id).run();
      } else {
        await c.env.DB.prepare(`
          UPDATE webhook_endpoints SET stats_failed = stats_failed + 1 WHERE id = ?
        `).bind(endpoint.id).run();
      }
       
      deliveries.push({
        endpoint: endpoint.name,
        success,
        status_code: statusCode,
        latency,
        log_id: result.meta.last_row_id
      });
    }
  }
   
  return c.json({ success: true, deliveries });
});

// ============================================
// SETTINGS ENDPOINTS
// ============================================

// Get all settings
app.get("/api/settings", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM app_settings ORDER BY setting_group, setting_key
  `).all();
   
  // Convert to grouped object
  const settings: Record<string, Record<string, string>> = {};
  for (const row of results as any[]) {
    if (!settings[row.setting_group]) {
      settings[row.setting_group] = {};
    }
    settings[row.setting_group][row.setting_key] = row.setting_value;
  }
   
  return c.json(settings);
});

// Get settings by group
app.get("/api/settings/:group", authMiddleware, async (c) => {
  const group = c.req.param("group");
   
  const { results } = await c.env.DB.prepare(`
    SELECT setting_key, setting_value FROM app_settings WHERE setting_group = ?
  `).bind(group).all();
   
  const settings: Record<string, string> = {};
  for (const row of results as any[]) {
    settings[row.setting_key] = row.setting_value;
  }
   
  return c.json(settings);
});

// Update settings (batch update for a group)
app.put("/api/settings/:group", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const group = c.req.param("group");
  const body = await c.req.json();
   
  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  // Get old values for audit
  const { results: oldSettings } = await c.env.DB.prepare(`
    SELECT setting_key, setting_value FROM app_settings WHERE setting_group = ?
  `).bind(group).all();
   
  const oldValues: Record<string, string> = {};
  for (const row of oldSettings as any[]) {
    oldValues[row.setting_key] = row.setting_value;
  }
   
  // Update each setting
  for (const [key, value] of Object.entries(body)) {
    await c.env.DB.prepare(`
      INSERT INTO app_settings (setting_key, setting_value, setting_group)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `).bind(key, String(value), group).run();
  }
   
  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'settings_updated', 'app_settings', ?, ?, ?)
  `).bind(
    (appUser[0] as any)?.id,
    group,
    JSON.stringify(oldValues),
    JSON.stringify(body)
  ).run();
   
  return c.json({ success: true });
});

// Update single setting
app.put("/api/settings/:group/:key", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const group = c.req.param("group");
  const key = c.req.param("key");
  const body = await c.req.json();
  const { value } = body;
   
  // Get old value
  const { results: oldSetting } = await c.env.DB.prepare(`
    SELECT setting_value FROM app_settings WHERE setting_key = ? AND setting_group = ?
  `).bind(key, group).all();
   
  await c.env.DB.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, setting_group)
    VALUES (?, ?, ?)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `).bind(key, String(value), group).run();
   
  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'setting_updated', 'app_settings', ?, ?, ?)
  `).bind(
    (appUser[0] as any)?.id,
    `${group}.${key}`,
    JSON.stringify({ [key]: (oldSetting[0] as any)?.setting_value }),
    JSON.stringify({ [key]: value })
  ).run();
   
  return c.json({ success: true });
});

// ============================================
// SAP BUSINESS ONE INTEGRATION ENDPOINTS
// ============================================

// Receive invoice/title data from SAP B1
app.post("/api/external/sap/invoices", async (c) => {
  const apiKey = c.req.header("X-API-Key");
   
  // 1. Busca TODAS as integrações SAP (ativas ou inativas)
  const { results: allIntegrations } = await c.env.DB.prepare(`
    SELECT * FROM integrations WHERE type = 'sap_b1'
  `).all();

  // 2. Encontra a integração correta comparando a senha
  const validIntegration = allIntegrations.find((integration: any) => {
    try {
      const creds = JSON.parse(integration.credentials || '{}');
      return creds.api_key === apiKey;
    } catch (e) { return false; }
  });

  if (!validIntegration) {
    return c.json({ error: "Invalid API key" }, 401);
  }
   
  const body = await c.req.json();
  const { invoices } = body;
   
  if (!invoices || !Array.isArray(invoices)) {
    return c.json({ error: "invoices array is required" }, 400);
  }
   
  let created = 0;
  let updated = 0;
  let errors: string[] = [];
   
  for (const invoice of invoices) {
    try {
      // Check if case exists by contract_id (SAP DocEntry)
      const { results: existing } = await c.env.DB.prepare(`
        SELECT id FROM cases WHERE contract_id = ?
      `).bind(invoice.doc_entry?.toString() || invoice.contract_id).all();
       
      if (existing.length > 0) {
        // Update existing case
        await c.env.DB.prepare(`
          UPDATE cases SET
            total_debt = COALESCE(?, total_debt),
            days_overdue = COALESCE(?, days_overdue),
            customer_name = COALESCE(?, customer_name),
            customer_document = COALESCE(?, customer_document),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          invoice.doc_total || invoice.total_debt,
          invoice.days_overdue || 0,
          invoice.card_name || invoice.customer_name,
          invoice.tax_id || invoice.customer_document,
          invoice.status || null,
          (existing[0] as any).id
        ).run();
        updated++;
      } else {
        // Create new case
        const { results: lastCase } = await c.env.DB.prepare(
          "SELECT case_number FROM cases ORDER BY id DESC LIMIT 1"
        ).all();
         
        let nextNumber = 1;
        if (lastCase.length > 0) {
          const lastNum = parseInt((lastCase[0] as any).case_number.replace('CASE-', ''));
          nextNumber = lastNum + 1;
        }
        const caseNumber = `CASE-${String(nextNumber).padStart(3, '0')}`;
         
        await c.env.DB.prepare(`
          INSERT INTO cases (
            case_number, customer_name, customer_document, customer_phone, customer_email,
            contract_id, contract_type, total_debt, days_overdue, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          caseNumber,
          invoice.card_name || invoice.customer_name || 'SAP Import',
          invoice.tax_id || invoice.customer_document,
          invoice.phone || invoice.customer_phone,
          invoice.email || invoice.customer_email,
          invoice.doc_entry?.toString() || invoice.contract_id,
          invoice.doc_type || 'invoice',
          invoice.doc_total || invoice.total_debt || 0,
          invoice.days_overdue || 0,
          'new',
          `Importado do SAP B1 em ${new Date().toISOString()}`
        ).run();
        created++;
      }
    } catch (err: any) {
      errors.push(`Invoice ${invoice.doc_entry || 'unknown'}: ${err.message}`);
    }
  }
   
  // Update integration stats
  await c.env.DB.prepare(`
    UPDATE integrations SET 
      last_sync_at = CURRENT_TIMESTAMP,
      stats_today = stats_today + ?,
      stats_month = stats_month + ?,
      stats_errors = stats_errors + ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(created + updated, created + updated, errors.length, (validIntegration as any).id).run();
   
  return c.json({ success: true, created, updated, errors });
});

// Send payment confirmation to SAP B1 (outbound)
app.get("/api/external/sap/payments", authMiddleware, async (c) => {
  const status = c.req.query("status") || 'paid';
  const since = c.req.query("since"); // ISO date
   
  let query = `
    SELECT p.*, c.contract_id, c.customer_name, c.customer_document
    FROM payments p
    JOIN cases c ON p.case_id = c.id
    WHERE p.status = ?
  `;
  const params: any[] = [status];
   
  if (since) {
    query += " AND p.paid_at >= ?";
    params.push(since);
  }
   
  query += " ORDER BY p.paid_at DESC";
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
   
  // Format for SAP B1
  const sapPayments = (results as any[]).map(p => ({
    doc_entry: p.contract_id,
    payment_date: p.paid_at,
    payment_amount: p.amount,
    payment_type: p.payment_type === 'pix' ? 'PIX' : 'BOLETO',
    external_reference: p.external_id,
    customer_name: p.customer_name,
    customer_document: p.customer_document
  }));
   
  return c.json({ payments: sapPayments, total: sapPayments.length });
});

// ============================================
// ERP BETA INTEGRATION ENDPOINTS
// ============================================

// Receive customer/case data from ERP Beta
app.post("/api/external/beta/customers", async (c) => {
  const apiKey = c.req.header("X-API-Key");
   
  // 1. Busca TODAS as integrações Beta (removemos o filtro de status)
  const { results: allIntegrations } = await c.env.DB.prepare(`
    SELECT * FROM integrations WHERE type = 'beta_erp'
  `).all();

  // 2. Procura a chave exata na lista (busca inteligente)
  const validIntegration = allIntegrations.find((integration: any) => {
    try {
      const creds = JSON.parse(integration.credentials || '{}');
      return creds.api_key === apiKey;
    } catch (e) { return false; }
  });

  // 3. Se não achou em nenhuma, aí sim é erro
  if (!validIntegration) {
    console.log(`❌ Chave recusada: ${apiKey} (Não encontrada em nenhuma integração)`);
    return c.json({ error: "Invalid API key" }, 401);
  }

  console.log(`✅ Autenticado via integração: ${(validIntegration as any).name} (ID: ${(validIntegration as any).id})`);
   
  const body = await c.req.json();
  const { customers } = body;
   
  if (!customers || !Array.isArray(customers)) {
    return c.json({ error: "customers array is required" }, 400);
  }
   
  let created = 0;
  let updated = 0;
  let errors: string[] = [];
   
  for (const customer of customers) {
    try {
      const { results: existing } = await c.env.DB.prepare(`
        SELECT id FROM cases WHERE customer_document = ? OR contract_id = ?
      `).bind(
        customer.cpf || customer.cnpj || customer.document,
        customer.id_beta?.toString() || customer.contract_id
      ).all();
       
      if (existing.length > 0) {
        await c.env.DB.prepare(`
          UPDATE cases SET
            customer_name = COALESCE(?, customer_name),
            customer_phone = COALESCE(?, customer_phone),
            customer_email = COALESCE(?, customer_email),
            total_debt = COALESCE(?, total_debt),
            days_overdue = COALESCE(?, days_overdue),
            risk_score = COALESCE(?, risk_score),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          customer.nome || customer.name,
          customer.telefone || customer.phone || null,
          customer.email || null,
          customer.valor_divida || customer.debt,
          customer.dias_atraso || customer.days_overdue,
          customer.score_risco || customer.risk_score,
          (existing[0] as any).id
        ).run();
        updated++;
      } else {
        const { results: lastCase } = await c.env.DB.prepare(
          "SELECT case_number FROM cases ORDER BY id DESC LIMIT 1"
        ).all();
         
        let nextNumber = 1;
        if (lastCase.length > 0) {
          const lastNum = parseInt((lastCase[0] as any).case_number.replace('CASE-', ''));
          nextNumber = lastNum + 1;
        }
        const caseNumber = `CASE-${String(nextNumber).padStart(3, '0')}`;
         
        await c.env.DB.prepare(`
          INSERT INTO cases (
            case_number, customer_name, customer_document, customer_phone, customer_email,
            contract_id, total_debt, days_overdue, status, risk_score, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          caseNumber,
          customer.nome || customer.name || 'Beta Import',
          customer.cpf || customer.cnpj || customer.document,
          customer.telefone || customer.phone || null,
          customer.email || null,
          customer.id_beta?.toString() || customer.contract_id,
          customer.valor_divida || customer.debt || 0,
          customer.dias_atraso || customer.days_overdue || 0,
          'new',
          customer.score_risco || customer.risk_score || 50,
          `Importado do ERP Beta em ${new Date().toISOString()}`
        ).run();
        created++;
      }
    } catch (err: any) {
      errors.push(`Customer ${customer.cpf || customer.id_beta || 'unknown'}: ${err.message}`);
    }
  }
   
  // Update integration stats
  await c.env.DB.prepare(`
    UPDATE integrations SET 
      last_sync_at = CURRENT_TIMESTAMP,
      stats_today = stats_today + ?,
      stats_month = stats_month + ?,
      stats_errors = stats_errors + ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(created + updated, created + updated, errors.length, (validIntegration as any).id).run();
   
  return c.json({ success: true, created, updated, errors });
});

// Get case status for ERP Beta (sync back)
app.get("/api/external/beta/cases", async (c) => {
  const apiKey = c.req.header("X-API-Key");
   
  const { results: allIntegrations } = await c.env.DB.prepare(`
    SELECT * FROM integrations WHERE type = 'beta_erp'
  `).all();

  const validIntegration = allIntegrations.find((integration: any) => {
    try {
      const creds = JSON.parse(integration.credentials || '{}');
      return creds.api_key === apiKey;
    } catch (e) { return false; }
  });

  if (!validIntegration) {
    return c.json({ error: "Invalid API key" }, 401);
  }
   
  const since = c.req.query("updated_since"); // ISO date
  const status = c.req.query("status");
   
  let query = "SELECT * FROM cases WHERE 1=1";
  const params: any[] = [];
   
  if (since) {
    query += " AND updated_at >= ?";
    params.push(since);
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
   
  query += " ORDER BY updated_at DESC LIMIT 1000";
   
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
   
  // Format for Beta ERP
  const betaCases = (results as any[]).map(c => ({
    id_soul_collect: c.id,
    case_number: c.case_number,
    id_beta: c.contract_id,
    cpf_cnpj: c.customer_document,
    nome_cliente: c.customer_name,
    valor_divida: c.total_debt,
    dias_atraso: c.days_overdue,
    status_cobranca: c.status,
    ultimo_contato: c.last_contact_at,
    canal_contato: c.last_contact_channel,
    score_risco: c.risk_score,
    tem_consentimento: Boolean(c.has_consent),
    atualizado_em: c.updated_at
  }));
   
  return c.json({ cases: betaCases, total: betaCases.length });
});

// Receive payment notification from Beta
app.post("/api/external/beta/payments", async (c) => {
  const apiKey = c.req.header("X-API-Key");
   
  const { results: allIntegrations } = await c.env.DB.prepare(`
    SELECT * FROM integrations WHERE type = 'beta_erp'
  `).all();

  const validIntegration = allIntegrations.find((integration: any) => {
    try {
      const creds = JSON.parse(integration.credentials || '{}');
      return creds.api_key === apiKey;
    } catch (e) { return false; }
  });

  if (!validIntegration) {
    return c.json({ error: "Invalid API key" }, 401);
  }
   
  const body = await c.req.json();
  const { payments } = body;
   
  if (!payments || !Array.isArray(payments)) {
    return c.json({ error: "payments array is required" }, 400);
  }
   
  let processed = 0;
  let errors: string[] = [];
   
  for (const payment of payments) {
    try {
      // Find case by contract_id (id_beta)
      const { results: cases } = await c.env.DB.prepare(`
        SELECT id FROM cases WHERE contract_id = ? OR customer_document = ?
      `).bind(
        payment.id_beta?.toString() || payment.contract_id,
        payment.cpf || payment.document
      ).all();
       
      if (cases.length === 0) {
        errors.push(`Case not found for ${payment.id_beta || payment.cpf}`);
        continue;
      }
       
      const caseId = (cases[0] as any).id;
       
      // Create payment record
      await c.env.DB.prepare(`
        INSERT INTO payments (
          case_id, payment_type, amount, status, paid_at, external_id, metadata
        ) VALUES (?, ?, ?, 'paid', ?, ?, ?)
      `).bind(
        caseId,
        payment.tipo || 'external',
        payment.valor || payment.amount,
        payment.data_pagamento || new Date().toISOString(),
        payment.id_transacao || payment.transaction_id,
        JSON.stringify({ source: 'beta_erp', original: payment })
      ).run();
       
      // Update case status if fully paid
      if (payment.quitado || payment.fully_paid) {
        await c.env.DB.prepare(`
          UPDATE cases SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(caseId).run();
      }
       
      // Add timeline entry
      await c.env.DB.prepare(`
        INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name)
        VALUES (?, 'payment', 'Pagamento Recebido (Beta)', ?, 'beta_erp', 'ERP Beta')
      `).bind(
        caseId,
        `Pagamento de R$ ${(payment.valor || payment.amount || 0).toFixed(2)} registrado via ERP Beta`
      ).run();
       
      processed++;
    } catch (err: any) {
      errors.push(`Payment ${payment.id_transacao || 'unknown'}: ${err.message}`);
    }
  }
   
  return c.json({ success: true, processed, errors });
});

// Webhook receiver for Beta events
app.post("/api/external/beta/webhook", async (c) => {
  const apiKey = c.req.header("X-API-Key");
  // Note: X-Beta-Signature can be used for additional webhook verification if needed
   
  const { results: allIntegrations } = await c.env.DB.prepare(`
    SELECT * FROM integrations WHERE type = 'beta_erp'
  `).all();

  const validIntegration = allIntegrations.find((integration: any) => {
    try {
      const creds = JSON.parse(integration.credentials || '{}');
      return creds.api_key === apiKey;
    } catch (e) { return false; }
  });

  if (!validIntegration) {
    return c.json({ error: "Invalid API key" }, 401);
  }
   
  const body = await c.req.json();
  const { event, data, timestamp } = body;
   
  // Log the webhook
  console.log(`[Beta Webhook] Event: ${event}, Timestamp: ${timestamp}`);
   
  // Process different event types
  switch (event) {
    case 'customer.created':
    case 'customer.updated':
      // Sync customer data
      if (data.customers) {
        // Reuse the customers endpoint logic
        // For now, just acknowledge
      }
      break;
       
    case 'payment.received':
      // Process payment
      if (data.payments) {
        // Reuse the payments endpoint logic
      }
      break;
       
    case 'contract.cancelled':
      // Update case status
      if (data.contract_id) {
        await c.env.DB.prepare(`
          UPDATE cases SET status = 'closed', notes = COALESCE(notes, '') || ' | Contrato cancelado via Beta', updated_at = CURRENT_TIMESTAMP
          WHERE contract_id = ?
        `).bind(data.contract_id).run();
      }
      break;
  }
   
  return c.json({ success: true, event, received_at: new Date().toISOString() });
});

// Get API documentation for external integrations
app.get("/api/external/docs", async (c) => {
  return c.json({
    title: "Soul Collect External API",
    version: "1.0.0",
    base_url: new URL(c.req.url).origin,
    authentication: {
      type: "API Key",
      header: "X-API-Key",
      description: "API key provided when configuring the integration"
    },
    endpoints: {
      sap_b1: {
        description: "SAP Business One Integration",
        endpoints: [
          {
            method: "POST",
            path: "/api/external/sap/invoices",
            description: "Send invoice/title data from SAP B1",
            body: {
              invoices: [{
                doc_entry: "number - SAP document entry ID",
                card_name: "string - Customer name",
                tax_id: "string - CPF/CNPJ",
                doc_total: "number - Total debt amount",
                days_overdue: "number - Days past due",
                phone: "string (optional) - Customer phone",
                email: "string (optional) - Customer email"
              }]
            }
          },
          {
            method: "GET",
            path: "/api/external/sap/payments",
            description: "Get confirmed payments for SAP B1 sync",
            query_params: {
              status: "string (default: 'paid')",
              since: "ISO date - Filter payments after this date"
            }
          }
        ]
      },
      beta_erp: {
        description: "ERP Beta Integration (Prospera)",
        endpoints: [
          {
            method: "POST",
            path: "/api/external/beta/customers",
            description: "Send customer/debtor data from Beta",
            body: {
              customers: [{
                id_beta: "string - Beta system ID",
                nome: "string - Customer name",
                cpf: "string - CPF or CNPJ",
                telefone: "string - Phone number",
                email: "string - Email",
                valor_divida: "number - Debt amount",
                dias_atraso: "number - Days overdue",
                score_risco: "number (0-100) - Risk score"
              }]
            }
          },
          {
            method: "GET",
            path: "/api/external/beta/cases",
            description: "Get case status updates for Beta sync",
            query_params: {
              updated_since: "ISO date - Filter cases updated after this date",
              status: "string - Filter by status"
            }
          },
          {
            method: "POST",
            path: "/api/external/beta/payments",
            description: "Notify Soul Collect of payments received in Beta",
            body: {
              payments: [{
                id_beta: "string - Beta contract ID",
                cpf: "string - Customer document",
                valor: "number - Payment amount",
                data_pagamento: "ISO date - Payment date",
                id_transacao: "string - Transaction ID",
                quitado: "boolean - Is debt fully paid"
              }]
            }
          },
          {
            method: "POST",
            path: "/api/external/beta/webhook",
            description: "Webhook endpoint for Beta events",
            events: [
              "customer.created",
              "customer.updated",
              "payment.received",
              "contract.cancelled"
            ]
          }
        ]
      }
    }
  });
});

// ============================================
// ADMIN DATABASE VIEWER ENDPOINTS
// ============================================

// Get all table stats
app.get("/api/admin/database/stats", authMiddleware, async (c) => {
  const currentUser = c.get("user");
   
  // Get current app user to check permissions
  const { results: appUserData } = await c.env.DB.prepare(`
    SELECT au.*, r.name as role_name FROM app_users au
    LEFT JOIN roles r ON au.role_id = r.id
    WHERE au.mocha_user_id = ?
  `).bind(currentUser!.id).all();
   
  const appUser = appUserData[0] as any;
  const isAdmin = appUser?.is_owner === 1 || appUser?.is_owner === true || appUser?.role_name === 'Administrador';
  const isSupervisor = appUser?.role_name === 'Supervisor';
   
  if (!isAdmin && !isSupervisor) {
    return c.json({ error: "Acesso negado. Apenas administradores e supervisores." }, 403);
  }
   
  // Get list of all tables
  const { results: tablesInfo } = await c.env.DB.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%'
    ORDER BY name
  `).all();
   
  const tables = [];
  for (const tableInfo of tablesInfo as any[]) {
    const { results: countResult } = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM ${tableInfo.name}`
    ).all();
    tables.push({
      name: tableInfo.name,
      count: (countResult[0] as any).count
    });
  }
   
  // Log this access
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, new_values)
    VALUES (?, 'database_stats_viewed', 'admin_database', ?)
  `).bind(appUser?.id, JSON.stringify({ tables_count: tables.length })).run();
   
  return c.json({ tables });
});

// Get table data
app.get("/api/admin/database/table/:name", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const tableName = c.req.param("name");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");
  const search = c.req.query("search") || "";
   
  // Get current app user to check permissions
  const { results: appUserData } = await c.env.DB.prepare(`
    SELECT au.*, r.name as role_name FROM app_users au
    LEFT JOIN roles r ON au.role_id = r.id
    WHERE au.mocha_user_id = ?
  `).bind(currentUser!.id).all();
   
  const appUser = appUserData[0] as any;
  const isAdmin = appUser?.is_owner === 1 || appUser?.is_owner === true || appUser?.role_name === 'Administrador';
  const isSupervisor = appUser?.role_name === 'Supervisor';
   
  if (!isAdmin && !isSupervisor) {
    return c.json({ error: "Acesso negado" }, 403);
  }
   
  // Validate table name to prevent SQL injection
  const validTables = [
    'app_users', 'roles', 'permissions', 'role_permissions', 'audit_logs',
    'cases', 'case_timeline', 'case_installments', 'payments',
    'journeys', 'journey_steps', 'whatsapp_messages', 'whatsapp_templates',
    'risk_alerts', 'risk_rules', 'supervisor_actions',
    'consent_types', 'consent_records', 'consent_history',
    'integrations', 'webhook_endpoints', 'webhook_logs',
    'app_settings', 'invite_tokens'
  ];
   
  if (!validTables.includes(tableName)) {
    return c.json({ error: "Tabela não permitida" }, 400);
  }
   
  // Get column info
  const { results: columnsInfo } = await c.env.DB.prepare(
    `PRAGMA table_info(${tableName})`
  ).all();
  const columns = (columnsInfo as any[]).map(col => col.name);
   
  // Build query with search
  let query = `SELECT * FROM ${tableName}`;
  const params: any[] = [];
   
  if (search) {
    // Search across all text columns
    const textColumns = (columnsInfo as any[])
      .filter(col => col.type.toUpperCase().includes('TEXT') || col.type.toUpperCase().includes('VARCHAR'))
      .map(col => col.name);
     
    if (textColumns.length > 0) {
      const searchConditions = textColumns.map(col => `${col} LIKE ?`).join(' OR ');
      query += ` WHERE (${searchConditions})`;
      textColumns.forEach(() => params.push(`%${search}%`));
    }
  }
   
  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
   
  const { results: rows } = await c.env.DB.prepare(query).bind(...params).all();
   
  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
  const countParams: any[] = [];
   
  if (search) {
    const textColumns = (columnsInfo as any[])
      .filter(col => col.type.toUpperCase().includes('TEXT') || col.type.toUpperCase().includes('VARCHAR'))
      .map(col => col.name);
     
    if (textColumns.length > 0) {
      const searchConditions = textColumns.map(col => `${col} LIKE ?`).join(' OR ');
      countQuery += ` WHERE (${searchConditions})`;
      textColumns.forEach(() => countParams.push(`%${search}%`));
    }
  }
   
  const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all();
  const total = (countResult[0] as any).total;
   
  return c.json({ columns, rows, total });
});

// Export table as CSV
app.get("/api/admin/database/export/:name", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const tableName = c.req.param("name");
   
  // Get current app user to check permissions
  const { results: appUserData } = await c.env.DB.prepare(`
    SELECT au.*, r.name as role_name FROM app_users au
    LEFT JOIN roles r ON au.role_id = r.id
    WHERE au.mocha_user_id = ?
  `).bind(currentUser!.id).all();
   
  const appUser = appUserData[0] as any;
  const isAdmin = appUser?.is_owner === 1 || appUser?.is_owner === true || appUser?.role_name === 'Administrador';
  const isSupervisor = appUser?.role_name === 'Supervisor';
   
  if (!isAdmin && !isSupervisor) {
    return c.json({ error: "Acesso negado" }, 403);
  }
   
  // Validate table name
  const validTables = [
    'app_users', 'roles', 'permissions', 'role_permissions', 'audit_logs',
    'cases', 'case_timeline', 'case_installments', 'payments',
    'journeys', 'journey_steps', 'whatsapp_messages', 'whatsapp_templates',
    'risk_alerts', 'risk_rules', 'supervisor_actions',
    'consent_types', 'consent_records', 'consent_history',
    'integrations', 'webhook_endpoints', 'webhook_logs',
    'app_settings', 'invite_tokens'
  ];
   
  if (!validTables.includes(tableName)) {
    return c.json({ error: "Tabela não permitida" }, 400);
  }
   
  // Get all data (limit 10000 for safety)
  const { results: rows } = await c.env.DB.prepare(
    `SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 10000`
  ).all();
   
  if (rows.length === 0) {
    return new Response('', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${tableName}_export.csv"`
      }
    });
  }
   
  // Generate CSV
  const headers = Object.keys(rows[0] as any);
  const csvRows = (rows as any[]).map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
   
  const csv = [headers.join(','), ...csvRows].join('\n');
   
  // Log export
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'database_export', 'admin_database', ?, ?)
  `).bind(appUser?.id, tableName, JSON.stringify({ rows_exported: rows.length })).run();
   
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${tableName}_export_${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
});

// ============================================
// DASHBOARD CONFIG ENDPOINTS
// ============================================

// Get all dashboard config
app.get("/api/dashboard/config", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM dashboard_config ORDER BY category, config_key
  `).all();
   
  // Convert to grouped object
  const config: Record<string, Record<string, any>> = {};
  for (const row of results as any[]) {
    if (!config[row.category]) {
      config[row.category] = {};
    }
    config[row.category][row.config_key] = {
      value: row.config_value,
      type: row.config_type,
      label: row.label,
      description: row.description
    };
  }
   
  return c.json({ config, raw: results });
});

// Update dashboard config
app.put("/api/dashboard/config", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { configs } = body;
   
  if (!configs || typeof configs !== 'object') {
    return c.json({ error: "configs object is required" }, 400);
  }
   
  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  // Get old values for audit
  const { results: oldConfigs } = await c.env.DB.prepare(`
    SELECT config_key, config_value FROM dashboard_config
  `).all();
   
  const oldValues: Record<string, string> = {};
  for (const row of oldConfigs as any[]) {
    oldValues[row.config_key] = row.config_value;
  }
   
  // Update each config
  for (const [key, value] of Object.entries(configs)) {
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `).bind(String(value ?? ''), key).run();
  }
   
  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'dashboard_config_updated', 'dashboard_config', 'batch', ?, ?)
  `).bind(
    (appUser[0] as any)?.id,
    JSON.stringify(oldValues),
    JSON.stringify(configs)
  ).run();
   
  return c.json({ success: true });
});

// Update single dashboard config
app.put("/api/dashboard/config/:key", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const key = c.req.param("key");
  const body = await c.req.json();
  const { value } = body;
   
  // Get old value
  const { results: oldConfig } = await c.env.DB.prepare(`
    SELECT config_value FROM dashboard_config WHERE config_key = ?
  `).bind(key).all();
   
  if (oldConfig.length === 0) {
    // Create new config if doesn't exist
    await c.env.DB.prepare(`
      INSERT INTO dashboard_config (config_key, config_value, config_type, label, category)
      VALUES (?, ?, 'text', ?, 'custom')
    `).bind(key, String(value ?? ''), key).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `).bind(String(value ?? ''), key).run();
  }
   
  // Get app user for audit
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (?, 'dashboard_config_updated', 'dashboard_config', ?, ?, ?)
  `).bind(
    (appUser[0] as any)?.id,
    key,
    JSON.stringify({ [key]: (oldConfig[0] as any)?.config_value }),
    JSON.stringify({ [key]: value })
  ).run();
   
  return c.json({ success: true });
});

// Import dashboard data (manual or from file)
app.post("/api/dashboard/import", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { portfolio_value, default_value, recovered_value, source } = body;
   
  // Get app user
  const { results: appUser } = await c.env.DB.prepare(
    "SELECT id FROM app_users WHERE mocha_user_id = ?"
  ).bind(currentUser!.id).all();
   
  const updates: Record<string, string> = {};
   
  if (portfolio_value !== undefined) {
    updates['manual_portfolio_value'] = String(portfolio_value);
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = 'manual_portfolio_value'
    `).bind(String(portfolio_value)).run();
  }
   
  if (default_value !== undefined) {
    updates['manual_default_value'] = String(default_value);
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = 'manual_default_value'
    `).bind(String(default_value)).run();
  }
   
  if (recovered_value !== undefined) {
    updates['manual_recovered_value'] = String(recovered_value);
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = 'manual_recovered_value'
    `).bind(String(recovered_value)).run();
  }
   
  // Enable manual data mode if any manual value was set
  if (Object.keys(updates).length > 0) {
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = '1', updated_at = CURRENT_TIMESTAMP WHERE config_key = 'use_manual_data'
    `).run();
     
    await c.env.DB.prepare(`
      UPDATE dashboard_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = 'data_source'
    `).bind(source || 'manual').run();
  }
   
  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (?, 'dashboard_data_imported', 'dashboard_config', 'import', ?)
  `).bind((appUser[0] as any)?.id, JSON.stringify({ ...updates, source })).run();
   
  return c.json({ success: true, updated: Object.keys(updates) });
});

// Get enhanced dashboard stats (combines automatic + manual data)
app.get("/api/dashboard/enhanced-stats", authMiddleware, async (c) => {
  // Get config
  const { results: configResults } = await c.env.DB.prepare(`
    SELECT config_key, config_value FROM dashboard_config
  `).all();
   
  const config: Record<string, string | null> = {};
  for (const row of configResults as any[]) {
    config[row.config_key] = row.config_value;
  }
   
  const useManualData = config['use_manual_data'] === '1';
  const dataSource = config['data_source'] || 'system';
   
  // Get automatic stats from cases
  const { results: caseStats } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(total_debt) as total_portfolio,
      SUM(CASE WHEN days_overdue > 0 THEN total_debt ELSE 0 END) as default_amount,
      SUM(CASE WHEN status = 'paid' THEN total_debt ELSE 0 END) as recovered_amount,
      SUM(CASE WHEN status = 'promised' THEN 1 ELSE 0 END) as payment_promises,
      SUM(CASE WHEN last_contact_at IS NOT NULL THEN 1 ELSE 0 END) as contacted_count
    FROM cases
  `).all();
   
  const autoStats = caseStats[0] as any;
  const totalCases = autoStats.total_cases || 1;
   
  // Determine final values based on config
  let totalPortfolio = autoStats.total_portfolio || 0;
  let defaultAmount = autoStats.default_amount || 0;
  let recoveredAmount = autoStats.recovered_amount || 0;
   
  if (useManualData || dataSource === 'manual') {
    if (config['manual_portfolio_value']) {
      totalPortfolio = parseFloat(config['manual_portfolio_value']);
    }
    if (config['manual_default_value']) {
      defaultAmount = parseFloat(config['manual_default_value']);
    }
    if (config['manual_recovered_value']) {
      recoveredAmount = parseFloat(config['manual_recovered_value']);
    }
  }
   
  const contactRate = autoStats.contacted_count / totalCases;
  const conversionRate = totalPortfolio > 0 ? recoveredAmount / totalPortfolio : 0;
   
  // Get goals
  const monthlyGoal = parseFloat(config['monthly_goal'] || '320000');
  const annualGoal = parseFloat(config['annual_goal'] || '3840000');
  const slaTarget = parseFloat(config['sla_target'] || '95');
  const contactRateTarget = parseFloat(config['contact_rate_target'] || '70');
  const conversionRateTarget = parseFloat(config['conversion_rate_target'] || '45');
   
  // Get cases by status
  const { results: statusCounts } = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count, SUM(total_debt) as debt
    FROM cases GROUP BY status
  `).all();
   
  return c.json({
    // Current values
    totalPortfolio,
    defaultAmount,
    recoveredAmount,
    paymentPromises: autoStats.payment_promises || 0,
    contactRate,
    conversionRate,
    totalCases: autoStats.total_cases || 0,
    slaCompliance: 0.92,
    statusCounts,
    // Goals and targets
    goals: {
      monthly: monthlyGoal,
      annual: annualGoal,
      slaTarget,
      contactRateTarget,
      conversionRateTarget
    },
    // Progress
    goalProgress: monthlyGoal > 0 ? recoveredAmount / monthlyGoal : 0,
    // Data source info
    dataSource,
    useManualData,
    // Config for editing
    config
  });
});

// ============================================
// AUDIT LOGS ENDPOINTS
// ============================================

// List audit logs
app.get("/api/admin/audit-logs", authMiddleware, async (c) => {
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");
  const action = c.req.query("action");
  const entityType = c.req.query("entity_type");

  let query = `
    SELECT al.*, au.name as user_name, au.email as user_email
    FROM audit_logs al
    LEFT JOIN app_users au ON al.user_id = au.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (action) {
    query += " AND al.action = ?";
    params.push(action);
  }
  if (entityType) {
    query += " AND al.entity_type = ?";
    params.push(entityType);
  }

  query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

export default app;