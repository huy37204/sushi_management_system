CREATE FUNCTION getUserIdByAccount(@USER_NAME NVARCHAR(50), @PASSWORD VARCHAR(20))
RETURNS TABLE
AS
RETURN
(
    SELECT 
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.ACCOUNT_ID 
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE
    FROM ACCOUNT AC
    WHERE AC.USER_NAME = @USER_NAME AND AC.PASSWORD = @PASSWORD
)