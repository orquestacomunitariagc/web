import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

/**
 * GET /api/members - Fetch all members (Master only)
 */
export async function GET() {
  const user = await currentUser();

  // Only Master can access this endpoint
  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse(
      "Access denied. Only Master users can manage members.",
      { status: 401 }
    );
  }

  try {
    const clerk = await (await clerkClient()).users;
    const response = await clerk.getUserList({ limit: 100 });

    // Use a safe cast to handle Clerk v5+ property names
    const res = response as any;
    const totalCount = res.totalCount ?? res.meta?.total_count ?? 0;

    // Paginate if needed
    if (response.data.length < totalCount) {
      const nextToken = res.meta?.next_page_token;
      if (nextToken) {
        const page2 = await clerk.getUserList({
          limit: 100,
          page_token: nextToken
        } as any);
        (response.data as any) = [...response.data, ...page2.data];
      }
    }

    const members = response.data.map((u: any) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Sin nombre",
      email: u.emailAddresses?.[0]?.emailAddress || "Sin email",
      primaryEmail: u.emailAddresses?.[0]?.emailAddress,
      roles: u.publicMetadata?.roles as string[] || [],
      isArchiver: !!u.publicMetadata?.isArchiver,
      isMaster: !!u.publicMetadata?.isMaster,
      isBanned: !!u.banned,
      createdAt: u.created_at
    }));

    return NextResponse.json(members);
  } catch (error: unknown) {
    console.error("Error fetching members:", error);

    // Return more specific error message
    if (error instanceof Error) {
      const clerkError = error as { code?: string; error_code?: string };
      const errorCode = clerkError.code || clerkError.error_code;

      if (errorCode === "not_found" || errorCode === "user_not_found") {
        return new NextResponse(
          `User not found: ${error.message}`,
          { status: 404 }
        );
      }
    }

    return new NextResponse(
      `Server error while fetching members: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}

/**
 * POST /api/members - Perform user actions (Master only)
 */
export async function POST(req: Request) {
  const user = await currentUser();

  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse(
      "Access denied. Only Master users can manage members.",
      { status: 401 }
    );
  }

  const body = await req.json();

  // Validate required fields
  const { userId, action } = body;

  if (!userId || !action) {
    return new NextResponse(
      "Missing required fields: userId and action are required",
      { status: 400 }
    );
  }

  // Validate userId format
  if (!userId.startsWith("user_")) {
    return new NextResponse(
      "Invalid userId format. Expected format: user_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
      { status: 400 }
    );
  }

  // Allowed actions
  const allowedActions = ["update-roles", "toggle-ban", "toggle-archiver", "toggle-master"];
  if (!allowedActions.includes(action)) {
    return new NextResponse(
      `Invalid action "${action}". Allowed actions: ${allowedActions.join(", ")}`,
      { status: 400 }
    );
  }

  const clerk = await (await clerkClient()).users;

  // Get current user data to handle race conditions safely
  let currentUserData: any;
  try {
    currentUserData = await clerk.getUser(userId);
  } catch (error) {
    console.error(`Error getting user ${userId} for action "${action}":`, error);
    return new NextResponse(
      `Error fetching user data: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }

  try {
    // Execute the requested action
    let success = true;
    let errorMessage = "";

    switch (action) {
      case "update-roles":
        {
          const { roles } = body;
          // Validate roles array
          if (!Array.isArray(roles)) {
            return new NextResponse(
              "Invalid roles: must be an array",
              { status: 400 }
            );
          }

          // Re-fetch user after potential concurrent modification
          const updatedUser = await clerk.getUser(userId);
          const currentMetadata = updatedUser.publicMetadata || {};

          await clerk.updateUserMetadata(userId, {
            publicMetadata: {
              ...currentMetadata,
              roles: roles
            }
          });
        }
        break;

      case "toggle-ban":
        {
          const { isBanned } = body;

          // Handle true/false or string "true"/"false"
          const banValue = !!isBanned;

          if (banValue) {
            await clerk.banUser(userId);
          } else {
            await clerk.unbanUser(userId);
          }
        }
        break;

      case "toggle-archiver":
        {
          const { isArchiver } = body;

          // Re-fetch user to handle race condition
          const updatedUser = await clerk.getUser(userId);
          const currentMetadata = updatedUser.publicMetadata || {};

          // Toggle: if undefined, invert. If explicitly true/false, use that value
          const newArchiverValue =
            isArchiver === undefined
              ? !currentMetadata.isArchiver
              : !!isArchiver;

          await clerk.updateUserMetadata(userId, {
            publicMetadata: {
              ...currentMetadata,
              isArchiver: newArchiverValue
            }
          });
        }
        break;

      case "toggle-master":
        {
          const { isMaster } = body;

          // Re-fetch user to handle race condition
          const updatedUser = await clerk.getUser(userId);
          const currentMetadata = updatedUser.publicMetadata || {};

          // Toggle: if undefined, invert. If explicitly true/false, use that value
          const newMasterValue =
            isMaster === undefined
              ? !currentMetadata.isMaster
              : !!isMaster;

          await clerk.updateUserMetadata(userId, {
            publicMetadata: {
              ...currentMetadata,
              isMaster: newMasterValue
            }
          });
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message: "Action completed successfully"
    });
  } catch (error) {
    console.error(`Error in user action "${action}":`, error);

    return new NextResponse(
      `Action failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
